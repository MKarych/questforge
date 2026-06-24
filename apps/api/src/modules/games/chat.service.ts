import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { $Enums } from '@prisma/client';

type GameStatus = $Enums.GameStatus;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * getChatMessages: получить сообщения чата для игры.
   * - LOBBY: все сообщения (общий чат)
   * - RUNNING: только сообщения с организатором (для игрока) или все (для организатора)
   * - FINISHED: все сообщения (общий чат)
   */
  async getChatMessages(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      select: {
        id: true,
        status: true,
        organizerId: true,
      },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    const isOrganizer = game.organizerId === userId;
    const status = game.status as string;

    // LOBBY и FINISHED — общий чат, все сообщения
    if (status === 'LOBBY' || status === 'FINISHED') {
      return this.prisma.gameComment.findMany({
        where: { gameId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    }

    // RUNNING — только сообщения с организатором
    if (status === 'RUNNING') {
      if (isOrganizer) {
        // Организатор видит все сообщения
        return this.prisma.gameComment.findMany({
          where: { gameId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        });
      } else {
        // Игрок видит только свои сообщения и ответы организатора
        return this.prisma.gameComment.findMany({
          where: {
            gameId,
            deletedAt: null,
            OR: [
              { authorId: userId },
              { authorId: game.organizerId },
            ],
          },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        });
      }
    }

    // Другие статусы — чат недоступен
    throw new BadRequestException({
      code: 'CHAT_NOT_AVAILABLE',
      message: `Чат недоступен в статусе ${game.status}`,
    });
  }

  /**
   * sendMessage: отправить сообщение в чат игры.
   * - LOBBY: все видят (общий чат)
   * - RUNNING: только организатор и отправитель (личные)
   * - FINISHED: все видят (общий чат)
   */
  async sendMessage(gameId: string, userId: string, text: string) {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_MESSAGE',
        message: 'Сообщение не может быть пустым',
      });
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      select: {
        id: true,
        status: true,
        organizerId: true,
      },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    const status = game.status as string;

    // Проверка: чат доступен только в LOBBY, RUNNING, FINISHED
    if (!['LOBBY', 'RUNNING', 'FINISHED'].includes(status)) {
      throw new BadRequestException({
        code: 'CHAT_NOT_AVAILABLE',
        message: `Чат недоступен в статусе ${game.status}`,
      });
    }

    const message = await this.prisma.gameComment.create({
      data: {
        gameId,
        authorId: userId,
        text: text.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`Message sent in game ${gameId} by user ${userId}`);

    return message;
  }

  /**
   * sendOrganizerMessage: отправить сообщение организатору (только во время RUNNING).
   */
  async sendOrganizerMessage(gameId: string, userId: string, text: string) {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_MESSAGE',
        message: 'Сообщение не может быть пустым',
      });
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      select: {
        id: true,
        status: true,
        organizerId: true,
      },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    // Только во время RUNNING
    if ((game.status as string) !== 'RUNNING') {
      throw new BadRequestException({
        code: 'CHAT_NOT_AVAILABLE',
        message: 'Личные сообщения организатору доступны только во время игры',
      });
    }

    const message = await this.prisma.gameComment.create({
      data: {
        gameId,
        authorId: userId,
        text: text.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`Organizer message sent in game ${gameId} by user ${userId}`);

    return message;
  }
}