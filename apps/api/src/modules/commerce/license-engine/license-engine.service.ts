import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LicenseStatus, RevocationReason } from '@prisma/client';

export interface LicenseValidationResult {
  allowed: boolean;
  reason?: 'NO_LICENSE' | 'EXPIRED' | 'LIMIT_EXCEEDED' | 'REVOKED' | 'VERSION_UNAVAILABLE' | 'SUSPENDED';
  licenseId?: string;
  licenseType?: string;
  remainingActivations?: number;
  expiresAt?: Date;
}

@Injectable()
export class LicenseEngineService {
  private readonly logger = new Logger(LicenseEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверка возможности запуска сценария
   */
  async validateLicense(
    userId: string,
    listingId: string,
    versionId: string,
  ): Promise<LicenseValidationResult> {
    const license = await this.prisma.userLicense.findFirst({
      where: {
        userId,
        listingId,
        status: LicenseStatus.ACTIVE,
      },
    });

    if (!license) {
      return { allowed: false, reason: 'NO_LICENSE' };
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return { allowed: false, reason: 'EXPIRED' };
    }

    if (license.activationsLimit > 0 && license.activationsUsed >= license.activationsLimit) {
      return { allowed: false, reason: 'LIMIT_EXCEEDED' };
    }

    const version = await this.prisma.scenarioVersion.findUnique({
      where: { id: versionId },
      select: { id: true, status: true },
    });

    if (!version || version.status !== 'PUBLISHED') {
      return { allowed: false, reason: 'VERSION_UNAVAILABLE' };
    }

    return {
      allowed: true,
      licenseId: license.id,
      licenseType: license.licenseType,
      remainingActivations:
        license.activationsLimit > 0
          ? license.activationsLimit - license.activationsUsed
          : Infinity,
      expiresAt: license.expiresAt ?? undefined,
    };
  }

  /**
   * Зафиксировать запуск сценария
   */
  async recordRun(
    userId: string,
    listingId: string,
    versionId: string,
    gameId?: string,
  ): Promise<{ runId: string; licenseId: string }> {
    const license = await this.prisma.userLicense.findFirst({
      where: {
        userId,
        listingId,
        status: LicenseStatus.ACTIVE,
      },
    });

    if (!license) {
      throw new BadRequestException('Активная лицензия не найдена');
    }

    if (license.activationsLimit > 0 && license.activationsUsed >= license.activationsLimit) {
      throw new BadRequestException('Лимит запусков по лицензии исчерпан');
    }

    const [run] = await this.prisma.$transaction([
      this.prisma.scenarioRun.create({
        data: {
          scenarioId: versionId,
          organizerId: userId,
          licenseId: license.id,
          gameId,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      }),
      this.prisma.userLicense.update({
        where: { id: license.id },
        data: {
          activationsUsed: { increment: 1 },
        },
      }),
    ]);

    this.logger.log(`Run recorded: license=${license.id}, user=${userId}, version=${versionId}`);

    return { runId: run.id, licenseId: license.id };
  }

  /**
   * Завершить запуск
   */
  async completeRun(runId: string, status: 'COMPLETED' | 'ABORTED' = 'COMPLETED'): Promise<void> {
    await this.prisma.scenarioRun.update({
      where: { id: runId },
      data: {
        status,
        endedAt: new Date(),
      },
    });
  }

  /**
   * Получить статус лицензии пользователя
   */
  async getLicenseStatus(userId: string, listingId: string) {
    const license = await this.prisma.userLicense.findFirst({
      where: { userId, listingId },
      include: {
        listing: {
          select: { id: true, title: true, licenseType: true },
        },
        scenarioVersion: {
          select: { id: true, version: true, versionLabel: true },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('Лицензия не найдена');
    }

    return license;
  }

  /**
   * Список лицензий пользователя
   */
  async getUserLicenses(userId: string) {
    return this.prisma.userLicense.findMany({
      where: { userId },
      include: {
        listing: {
          select: { id: true, title: true, coverUrl: true, licenseType: true },
        },
        scenarioVersion: {
          select: { id: true, version: true, versionLabel: true },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  /**
   * Отозвать лицензию
   */
  async revokeLicense(
    licenseId: string,
    reason: RevocationReason,
    revokedBy: string,
  ): Promise<void> {
    const license = await this.prisma.userLicense.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      throw new NotFoundException('Лицензия не найдена');
    }

    if (license.status !== LicenseStatus.ACTIVE) {
      throw new BadRequestException('Лицензия уже неактивна');
    }

    await this.prisma.userLicense.update({
      where: { id: licenseId },
      data: {
        status: LicenseStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
        revokedBy,
      },
    });

    this.logger.warn(`License ${licenseId} revoked by ${revokedBy}. Reason: ${reason}`);
  }
}