import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить уведомления пользователя с пагинацией
   */
  async getUserNotifications(userId: string, params: { limit: number; offset: number }) {
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { items, total, unreadCount };
  }

  /**
   * Получить последние N непрочитанных уведомлений (для выпадашки)
   */
  async getRecentNotifications(userId: string, limit = 10) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return { items, unreadCount };
  }

  /**
   * Отметить одно уведомление как прочитанное
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Отметить все уведомления пользователя как прочитанные
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'Все уведомления отмечены как прочитанные' };
  }

  /**
   * Создать уведомление
   */
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
      },
    });

    this.logger.log(`Notification created: ${notification.id} for user ${data.userId}`);
    return notification;
  }

  /**
   * Создать уведомления для нескольких пользователей
   */
  async createForUsers(
    userIds: string[],
    data: {
      type: string;
      title: string;
      message?: string;
      link?: string;
    },
  ) {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
      })),
    });

    this.logger.log(`Notifications created for ${userIds.length} users`);
    return notifications;
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }
}