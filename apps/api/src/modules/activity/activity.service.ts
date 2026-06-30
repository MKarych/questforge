import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Получить последние события для блока "Прямо сейчас".
   */
  async getLiveEvents(limit = 10) {
    const events = await this.prisma.activityEvent.findMany({
      take: Math.min(limit, 50),
      orderBy: { createdAt: 'desc' },
    });

    return events.map((e: { id: string; type: string; userId: string; userName: string; userAvatar: string | null; payload: Prisma.JsonValue; createdAt: Date }) => ({
      id: e.id,
      type: e.type,
      userId: e.userId,
      userName: e.userName,
      userAvatar: e.userAvatar,
      payload: e.payload,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  /**
   * Создать событие активности и отправить через WebSocket.
   */
  async createEvent(
    type: string,
    userId: string,
    userName: string,
    userAvatar: string | null,
    payload: Prisma.InputJsonValue = {},
  ) {
    const event = await this.prisma.activityEvent.create({
      data: {
        type: type as any,
        userId,
        userName,
        userAvatar,
        payload,
      },
    });

    this.logger.log(`Activity event created: ${type} by ${userName} (${userId})`);

    // Отправляем через WebSocket всем подписчикам канала activity:live
    this.realtimeGateway.broadcastToActivity({
      id: event.id,
      type: event.type,
      userId: event.userId,
      userName: event.userName,
      userAvatar: event.userAvatar,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt.toISOString(),
    });

    return event;
  }
}