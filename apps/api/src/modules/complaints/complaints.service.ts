import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComplaintDto, ComplaintTargetType } from './dto/create-complaint.dto';
import { ModerateComplaintDto, ModerationAction } from './dto/moderate-complaint.dto';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Создание жалобы (любой авторизованный пользователь)
  // ============================================================

  async create(reporterId: string, dto: CreateComplaintDto) {
    // Проверяем, не отправлял ли пользователь уже жалобу на этот объект
    const existing = await this.prisma.complaint.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new ConflictException('Вы уже отправили жалобу на этот объект. Она ожидает рассмотрения.');
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        description: dto.description,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.log(`Complaint created: ${complaint.id} by user ${reporterId} on ${dto.targetType}:${dto.targetId}`);

    return this.formatComplaint(complaint);
  }

  // ============================================================
  // Список жалоб (ADMIN / MODERATOR)
  // ============================================================

  async findAll(params: {
    status?: string;
    targetType?: string;
    limit: number;
    offset: number;
  }) {
    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.targetType) {
      where.targetType = params.targetType;
    }

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          moderator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      items: items.map((item) => this.formatComplaint(item)),
      total,
    };
  }

  // ============================================================
  // Детали жалобы (ADMIN / MODERATOR)
  // ============================================================

  async findById(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Жалоба не найдена');
    }

    // Получаем информацию о целевом объекте
    const targetInfo = await this.getTargetInfo(complaint.targetType as ComplaintTargetType, complaint.targetId);

    return {
      ...this.formatComplaint(complaint),
      targetInfo,
    };
  }

  // ============================================================
  // Принять жалобу (ADMIN / MODERATOR)
  // ============================================================

  async approve(id: string, moderatorId: string, dto: ModerateComplaintDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Жалоба не найдена');
    }

    if (complaint.status !== 'PENDING') {
      throw new ConflictException('Жалоба уже рассмотрена');
    }

    // Блокируем целевой объект
    await this.blockTarget(
      complaint.targetType as ComplaintTargetType,
      complaint.targetId,
      dto.action,
    );

    // Обновляем жалобу
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'APPROVED',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationNote: dto.moderationNote || null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Complaint ${id} approved by moderator ${moderatorId}. Action: ${dto.action}`);

    return this.formatComplaint(updated);
  }

  // ============================================================
  // Отклонить жалобу (ADMIN / MODERATOR)
  // ============================================================

  async reject(id: string, moderatorId: string, note?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Жалоба не найдена');
    }

    if (complaint.status !== 'PENDING') {
      throw new ConflictException('Жалоба уже рассмотрена');
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'REJECTED',
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationNote: note || null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Complaint ${id} rejected by moderator ${moderatorId}`);

    return this.formatComplaint(updated);
  }

  // ============================================================
  // Приватные методы
  // ============================================================

  private formatComplaint(complaint: any) {
    return {
      id: complaint.id,
      reporterId: complaint.reporterId,
      reporterName: complaint.reporter?.name || 'Unknown',
      reporterAvatar: complaint.reporter?.avatarUrl || null,
      targetType: complaint.targetType,
      targetId: complaint.targetId,
      reason: complaint.reason,
      description: complaint.description,
      status: complaint.status,
      moderatedBy: complaint.moderator?.id || null,
      moderatedByName: complaint.moderator?.name || null,
      moderatedAt: complaint.moderatedAt?.toISOString() || null,
      moderationNote: complaint.moderationNote,
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
    };
  }

  private async getTargetInfo(targetType: ComplaintTargetType, targetId: string) {
    switch (targetType) {
      case 'GAME': {
        const game = await this.prisma.game.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, status: true, slug: true },
        });
        return game;
      }
      case 'SCENARIO': {
        const scenario = await this.prisma.scenario.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, isPublished: true },
        });
        return scenario;
      }
      case 'COMMENT': {
        const comment = await this.prisma.comment.findUnique({
          where: { id: targetId },
          select: { id: true, text: true, deletedAt: true },
        });
        return comment;
      }
      case 'REVIEW': {
        const review = await this.prisma.review.findUnique({
          where: { id: targetId },
          select: { id: true, text: true, rating: true, deletedAt: true },
        });
        return review;
      }
      case 'MARKETPLACE_REVIEW': {
        const review = await this.prisma.marketplaceReview.findUnique({
          where: { id: targetId },
          select: { id: true, text: true, rating: true, status: true },
        });
        return review;
      }
      case 'USER': {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, email: true, status: true },
        });
        return user;
      }
      case 'TEAM': {
        const team = await this.prisma.team.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, slug: true, status: true },
        });
        return team;
      }
      case 'CHAT_MESSAGE': {
        const message = await this.prisma.chatMessage.findUnique({
          where: { id: targetId },
          select: { id: true, text: true, deletedAt: true },
        });
        return message;
      }
      default:
        return null;
    }
  }

  private async blockTarget(
    targetType: ComplaintTargetType,
    targetId: string,
    action: ModerationAction,
  ) {
    const now = new Date();

    switch (targetType) {
      case 'GAME': {
        await this.prisma.game.update({
          where: { id: targetId },
          data: {
            status: 'BLOCKED',
            ...(action === 'hard' ? { deletedAt: now } : {}),
          },
        });
        break;
      }
      case 'SCENARIO': {
        await this.prisma.scenario.update({
          where: { id: targetId },
          data: {
            isPublished: false,
            ...(action === 'hard' ? { deletedAt: now } : {}),
          },
        });
        break;
      }
      case 'COMMENT': {
        await this.prisma.comment.update({
          where: { id: targetId },
          data: { deletedAt: now },
        });
        break;
      }
      case 'REVIEW': {
        await this.prisma.review.update({
          where: { id: targetId },
          data: { deletedAt: now },
        });
        break;
      }
      case 'MARKETPLACE_REVIEW': {
        await this.prisma.marketplaceReview.update({
          where: { id: targetId },
          data: { status: 'REJECTED' },
        });
        break;
      }
      case 'USER': {
        await this.prisma.user.update({
          where: { id: targetId },
          data: { status: 'BANNED' },
        });
        break;
      }
      case 'TEAM': {
        await this.prisma.team.update({
          where: { id: targetId },
          data: {
            status: 'DELETED',
            ...(action === 'hard' ? { deletedAt: now } : {}),
          },
        });
        break;
      }
      case 'CHAT_MESSAGE': {
        await this.prisma.chatMessage.update({
          where: { id: targetId },
          data: { deletedAt: now },
        });
        break;
      }
      default:
        throw new ForbiddenException(`Неизвестный тип объекта: ${targetType}`);
    }
  }
}