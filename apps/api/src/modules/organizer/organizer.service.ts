import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganizerApplicationDto } from './dto/create-organizer-application.dto';
import { OrganizerStatus, Role } from '@prisma/client';

@Injectable()
export class OrganizerService {
  private readonly logger = new Logger(OrganizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: CreateOrganizerApplicationDto) {
    // Check if user already has an application
    const existingApplication = await this.prisma.organizerApplication.findUnique({
      where: { userId },
    });

    if (existingApplication) {
      throw new ConflictException('Заявка уже подана. Дождитесь решения.');
    }

    // Check if user is already an organizer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.organizerStatus === OrganizerStatus.APPROVED || user.role === Role.ORGANIZER) {
      throw new ConflictException('Вы уже являетесь организатором');
    }

    // Create application
    const application = await this.prisma.organizerApplication.create({
      data: {
        ...dto,
        userId,
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        organizerStatus: OrganizerStatus.PENDING,
        organizerApplicationId: application.id,
      },
    });

    this.logger.log(`Organizer application created: ${application.id} by user ${userId}`);
    return application;
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizerStatus: true,
        organizerApprovedAt: true,
        organizerApplication: {
          select: {
            id: true,
            status: true,
            rejectionReason: true,
            reviewedAt: true,
            city: true,
            phone: true,
            telegram: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      organizerStatus: user.organizerStatus,
      organizerApprovedAt: user.organizerApprovedAt,
      application: user.organizerApplication,
    };
  }

  async findAllApplications() {
    const applications = await this.prisma.organizerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            gamesCreated: true,
            scenariosCreated: true,
          },
        },
      },
    });

    return applications;
  }

  async reviewApplication(
    applicationId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    reviewedBy?: string,
  ) {
    const application = await this.prisma.organizerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (application.status !== 'PENDING') {
      throw new ConflictException('Заявка уже рассмотрена');
    }

    // Update application
    const updatedApplication = await this.prisma.organizerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        rejectionReason,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    // Update user
    if (status === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: application.userId },
        data: {
          organizerStatus: OrganizerStatus.APPROVED,
          role: Role.ORGANIZER,
          organizerApprovedAt: new Date(),
        },
      });

      this.logger.log(`Application ${applicationId} approved. User ${application.userId} is now ORGANIZER`);
    } else {
      await this.prisma.user.update({
        where: { id: application.userId },
        data: {
          organizerStatus: OrganizerStatus.REJECTED,
        },
      });

      this.logger.log(`Application ${applicationId} rejected. Reason: ${rejectionReason}`);
    }

    return updatedApplication;
  }
}
