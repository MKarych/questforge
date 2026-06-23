import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Dashboard Stats
  // ============================================================

  async getStats() {
    const [
      totalUsers,
      totalOrganizers,
      totalGames,
      activeGames,
      totalScenarios,
      pendingGames,
      pendingApplications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { role: 'ORGANIZER', deletedAt: null },
      }),
      this.prisma.game.count({ where: { deletedAt: null } }),
      this.prisma.game.count({
        where: {
          status: { in: ['IN_PROGRESS', 'STARTED', 'PUBLISHED'] },
          deletedAt: null,
        },
      }),
      this.prisma.scenario.count(),
      this.prisma.game.count({
        where: { moderationStatus: 'PENDING', deletedAt: null },
      }),
      this.prisma.organizerApplication.count({
        where: { status: 'PENDING' },
      }),
    ]);

    return {
      totalUsers,
      totalOrganizers,
      totalGames,
      activeGames,
      totalScenarios,
      pendingGames,
      pendingApplications,
    };
  }

  // ============================================================
  // Games Moderation
  // ============================================================

  async getPendingGames(params: { limit: number; offset: number }) {
    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where: { moderationStatus: 'PENDING', deletedAt: null },
        include: {
          organizer: {
            select: { id: true, name: true, avatarUrl: true, email: true },
          },
          scenario: {
            select: { id: true, name: true },
          },
          _count: {
            select: { reviews: true, gameTeams: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.game.count({
        where: { moderationStatus: 'PENDING', deletedAt: null },
      }),
    ]);

    return { items, total };
  }

  async approveGame(gameId: string, moderatorId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.moderationStatus !== 'PENDING') {
      throw new ConflictException('Игра уже прошла модерацию');
    }

    const updated = await this.prisma.game.update({
      where: { id: gameId },
      data: {
        moderationStatus: 'APPROVED',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        moderatedAt: new Date(),
        moderationComment: null,
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Game ${gameId} approved by moderator ${moderatorId}`);
    return updated;
  }

  async rejectGame(gameId: string, reason: string, moderatorId: string) {
    if (!reason || reason.trim().length === 0) {
      throw new ForbiddenException('Причина отклонения обязательна');
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.moderationStatus !== 'PENDING') {
      throw new ConflictException('Игра уже прошла модерацию');
    }

    const updated = await this.prisma.game.update({
      where: { id: gameId },
      data: {
        moderationStatus: 'REJECTED',
        moderatedAt: new Date(),
        moderationComment: reason.trim(),
      },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Game ${gameId} rejected by moderator ${moderatorId}. Reason: ${reason}`);
    return updated;
  }

  // ============================================================
  // Organizer Applications
  // ============================================================

  async getPendingApplications() {
    const applications = await this.prisma.organizerApplication.findMany({
      where: { status: 'PENDING' },
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

  async approveApplication(applicationId: string, moderatorId: string) {
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
    await this.prisma.organizerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    });

    // Update user role
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        organizerStatus: 'APPROVED',
        role: 'ORGANIZER',
        organizerApprovedAt: new Date(),
      },
    });

    this.logger.log(
      `Application ${applicationId} approved. User ${application.userId} is now ORGANIZER`,
    );

    return { message: 'Заявка одобрена', userId: application.userId };
  }

  async rejectApplication(applicationId: string, reason: string, moderatorId: string) {
    if (!reason || reason.trim().length === 0) {
      throw new ForbiddenException('Причина отклонения обязательна');
    }

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
    await this.prisma.organizerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    });

    // Reset user organizer status
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        organizerStatus: 'REJECTED',
      },
    });

    this.logger.log(
      `Application ${applicationId} rejected by ${moderatorId}. Reason: ${reason}`,
    );

    return { message: 'Заявка отклонена', userId: application.userId };
  }

  // ============================================================
  // Users Management (ADMIN only)
  // ============================================================

  async getUsers(params: { search?: string; limit: number; offset: number }) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizerStatus: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          gamesCreated: true,
          scenariosCreated: true,
          _count: {
            select: {
              captainTeams: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async blockUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Нельзя заблокировать администратора');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });

    this.logger.log(`User ${userId} blocked`);
    return { message: 'Пользователь заблокирован' };
  }

  async unblockUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`User ${userId} unblocked`);
    return { message: 'Пользователь разблокирован' };
  }

  async changeUserRole(userId: string, newRole: string) {
    const allowedRoles = ['PLAYER', 'ORGANIZER', 'MODERATOR', 'AUTHOR'];
    if (!allowedRoles.includes(newRole)) {
      throw new ForbiddenException(`Недопустимая роль: ${newRole}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Нельзя изменить роль администратора');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });

    this.logger.log(`User ${userId} role changed to ${newRole}`);
    return { message: `Роль изменена на ${newRole}` };
  }
}