import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameStateMachine } from '../../engine/state-machine/state-machine';
import { GameStatus } from '../../engine/types/engine.types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);
  private readonly gameStateMachine = new GameStateMachine();

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Public methods
  // ============================================================

  async findAllPublic(params: {
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {
      status: { in: ['PUBLISHED', 'IN_PROGRESS', 'STARTED'] }, // Only show published and active games
      deletedAt: null,
    };

    if (params.city) {
      where.city = params.city;
    }

    if (params.dateFrom) {
      where.date = { gte: new Date(params.dateFrom) };
    }

    if (params.dateTo) {
      where.date = { 
        ...(where.date as object),
        lte: new Date(params.dateTo) 
      };
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { date: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          date: true,
          duration: true,
          price: true,
          maxTeams: true,
          shareLink: true,
          imageUrl: true,
          status: true,
          publishedAt: true,
          organizer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
_count: {
            select: {
              gameTeams: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      data: games.map((g) => ({
        ...g,
        averageRating: g._count.reviews > 0
          ? g._count.reviews // Placeholder — would need a separate query for actual avg
          : 0,
        reviewsCount: g._count.reviews,
        teamsCount: g._count.gameTeams,
      })),
      meta: {
        total,
        limit: params.limit || 20,
        offset: params.offset || 0,
      },
    };
  }

  async findOneByShareLink(shareLink: string) {
    const game = await this.prisma.game.findUnique({
      where: { shareLink, deletedAt: null },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        scenario: {
          select: {
            id: true,
            name: true,
            description: true,
            version: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            text: true,
            createdAt: true,
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
_count: {
          select: {
            gameTeams: true,
            reviews: true,
            comments: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Calculate average rating
    const reviews = game.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : 0;

    const count = game._count || { gameTeams: 0, reviews: 0, comments: 0 };

    return {
      ...game,
      averageRating: Math.round(avgRating * 100) / 100,
      reviewsCount: count.reviews,
      teamsCount: count.gameTeams,
      commentsCount: count.comments,
    };
  }

  async findAll(params: {
    status?: string;
    city?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {
      publishedAt: { not: null }, // Only show published games
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }
    if (params.city) {
      where.city = params.city;
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { date: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          date: true,
          duration: true,
          price: true,
          maxTeams: true,
          imageUrl: true,
          status: true,
          publishedAt: true,
          organizer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
_count: {
            select: {
              gameTeams: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      data: games.map((g) => ({
        ...g,
        averageRating: g._count.reviews > 0
          ? g._count.reviews // Placeholder — would need a separate query for actual avg
          : 0,
      })),
      meta: {
        total,
        limit: params.limit || 20,
        offset: params.offset || 0,
      },
    };
  }

  async findOne(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        scenario: {
          select: {
            id: true,
            name: true,
            description: true,
            version: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
        },
_count: {
          select: {
            gameTeams: true,
            reviews: true,
            comments: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Calculate average rating
    const avgRating =
      game.reviews?.length > 0
        ? game.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / game.reviews.length
        : 0;

    return {
      ...game,
      averageRating: Math.round(avgRating * 100) / 100,
      shareLink: game.shareLink,
    };
  }

  async getReviews(
    gameId: string,
    params: { limit?: number; offset?: number },
  ) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { gameId },
        take: params.limit || 10,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where: { gameId } }),
    ]);

    return {
      data: reviews,
      meta: { total, limit: params.limit || 10, offset: params.offset || 0 },
    };
  }

  async getTeams(
    gameId: string,
    params: { limit?: number; offset?: number },
  ) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Получаем команды через связь GameTeam
    const gameTeams = await this.prisma.gameTeam.findMany({
      where: { gameId },
      select: {
        teamId: true,
      },
    });

    const teamIds = gameTeams.map(gt => gt.teamId);

    if (teamIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, limit: params.limit || 20, offset: params.offset || 0 },
      };
    }

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: {
          id: { in: teamIds },
        },
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { score: 'desc' },
        select: {
          id: true,
          name: true,
          score: true,
          penalties: true,
          status: true,
          finishedAt: true,
          captain: { select: { name: true } },
        },
      }),
      this.prisma.team.count({
        where: {
          id: { in: teamIds },
        },
      }),
    ]);

    return {
      data: teams,
      meta: { total, limit: params.limit || 20, offset: params.offset || 0 },
    };
  }

  // ============================================================
  // Protected methods (require auth)
  // ============================================================

  async create(userId: string, dto: CreateGameDto) {
    const game = await this.prisma.game.create({
      data: {
        ...dto,
        organizerId: userId,
        shareLink: this.generateShareLink(),
      },
    });

    // Auto-promote user to ORGANIZER if they have created and conducted games
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        gamesCreated: { increment: 1 },
      },
    });

    this.logger.log(`Game created: ${game.id} by user ${userId}`);
    return game;
  }

  async findAllForOrganizer(
    userId: string,
    params: { status?: string; limit?: number; offset?: number },
  ) {
    const where: Record<string, unknown> = {
      organizerId: userId,
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          date: true,
          status: true,
          moderationStatus: true,
          shareLink: true,
          publishedAt: true,
_count: { select: { gameTeams: true, reviews: true } },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      data: games,
      meta: { total, limit: params.limit || 20, offset: params.offset || 0 },
    };
  }

  async findOneForOrganizer(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, organizerId: userId, deletedAt: null },
      include: {
        scenario: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { gameTeams: true, reviews: true } },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    return game;
  }

  async update(
    userId: string,
    gameId: string,
    dto: Partial<CreateGameDto>,
  ) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: dto,
    });
  }

  async remove(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    // Soft delete
    return this.prisma.game.update({
      where: { id: gameId },
      data: { deletedAt: new Date() },
    });
  }

  async submitForModeration(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    if (!game.scenarioId) {
      throw new ForbiddenException('Cannot submit without a scenario');
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        moderationStatus: 'PENDING',
        submittedAt: new Date(),
      },
    });
  }

  async startGame(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    // Use state machine for transition
    if (!this.gameStateMachine.canTransition(game.status as GameStatus, 'start')) {
      throw new ForbiddenException(
        `Cannot start game in status: ${game.status}`,
      );
    }

    // Transition through state machine
    const newStatus = this.gameStateMachine.transition(game.status as GameStatus, 'start');

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: newStatus,
        startedAt: new Date(),
      },
    });
  }

  async finishGame(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('You do not have access to this game');
    }

    if (!this.gameStateMachine.canTransition(game.status as GameStatus, 'finish')) {
      throw new ForbiddenException(
        `Cannot finish game in status: ${game.status}`,
      );
    }

    const newStatus = this.gameStateMachine.transition(game.status as GameStatus, 'finish');

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: newStatus,
        finishedAt: new Date(),
      },
    });
  }

  private generateShareLink(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async uploadCover(userId: string, gameId: string, file: Express.Multer.File): Promise<{ url: string }> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('У вас нет доступа к этой игре');
    }

    // Generate unique filename with UUID
    const ext = path.extname(file.originalname) || this.getExtension(file.mimetype);
    const filename = `${uuidv4()}${ext}`;
    const destPath = path.join(process.cwd(), 'public', 'uploads', 'covers', filename);

    // Move file from multer temp location to final destination
    fs.renameSync(file.path, destPath);

    // Generate URL
    const url = `/uploads/covers/${filename}`;

    // Update game with image URL
    await this.prisma.game.update({
      where: { id: gameId },
      data: { imageUrl: url },
    });

    this.logger.log(`Cover uploaded for game ${gameId}: ${url}`);

    return { url };
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return extensions[mimeType] || '.jpg';
  }

  async publishGame(userId: string, gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException('У вас нет доступа к этой игре');
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  // ============================================================
  // Admin moderation methods
  // ============================================================

  async findPendingGames(params: { limit: number; offset: number }) {
    const [items, total] = await Promise.all([
      this.prisma.game.findMany({
        where: {
          moderationStatus: 'PENDING',
          deletedAt: null,
        },
        include: {
          organizer: {
            select: { id: true, name: true, avatarUrl: true },
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
        where: {
          moderationStatus: 'PENDING',
          deletedAt: null,
        },
      }),
    ]);

    return { items, total };
  }

  async moderateGame(
    gameId: string,
    status: 'APPROVED' | 'REJECTED',
    comment: string | undefined,
    moderatorId: string,
  ) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.moderationStatus !== 'PENDING') {
      throw new ForbiddenException('Игра уже прошла модерацию');
    }

    const updateData: Record<string, unknown> = {
      moderationStatus: status,
      moderatedAt: new Date(),
    };

    if (comment) {
      updateData.moderationComment = comment;
    }

    if (status === 'APPROVED') {
      updateData.status = 'PUBLISHED';
      updateData.publishedAt = new Date();
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: updateData,
      include: {
        organizer: {
          select: { id: true, name: true },
        },
      },
    });
  }
}
