import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityFeedService {
  private readonly logger = new Logger(ActivityFeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить публичную ленту активности
   */
  async getFeed(limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count(),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        userId: log.userId,
        type: log.type,
        payload: log.payload,
        createdAt: log.createdAt.toISOString(),
        user: log.user,
      })),
      meta: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Получить ленту активности пользователя
   */
  async getUserFeed(userId: string, limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        userId: log.userId,
        type: log.type,
        payload: log.payload,
        createdAt: log.createdAt.toISOString(),
        user: log.user,
      })),
      meta: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Создать запись в ленте активности
   */
  async createActivity(userId: string, type: string, payload: Prisma.InputJsonValue = {}) {
    try {
      const activity = await this.prisma.activityLog.create({
        data: {
          userId,
          type,
          payload,
        },
      });
      return activity;
    } catch (e) {
      this.logger.warn(`Failed to create activity log: ${e}`);
      return null;
    }
  }
}