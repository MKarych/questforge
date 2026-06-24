import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, GameStatus, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Slug generation
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 150);
}

function generateShareLink(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Domain Validation (Раздел 13)
  // ============================================================

  private async validateCreateGame(data: CreateGameDto, organizerId: string): Promise<void> {
    // 1. Дата игры не может быть в прошлом
    const gameDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (gameDate < today) {
      throw new BadRequestException({
        code: 'GAME_IN_PAST',
        message: 'Дата игры не может быть в прошлом',
      });
    }

    // 2. Время не пустое
    if (!data.time || !/^\d{2}:\d{2}$/.test(data.time)) {
      throw new BadRequestException({
        code: 'INVALID_TIME',
        message: 'Время игры должно быть в формате HH:mm',
      });
    }

    // 3. Длительность > 0
    if (data.duration <= 0) {
      throw new BadRequestException({
        code: 'INVALID_DURATION',
        message: 'Длительность игры должна быть больше 0',
      });
    }

    // 4. Максимум команд > 0
    if (data.maxTeams <= 0) {
      throw new BadRequestException({
        code: 'INVALID_MAX_TEAMS',
        message: 'Максимум команд должен быть больше 0',
      });
    }

    // 5. Цена >= 0
    if (data.price < 0) {
      throw new BadRequestException({
        code: 'INVALID_PRICE',
        message: 'Цена не может быть отрицательной',
      });
    }

    // 6. Сценарий должен быть опубликован
    if (data.scenarioId) {
      const scenario = await this.prisma.scenario.findUnique({
        where: { id: data.scenarioId },
        select: { isPublished: true },
      });
      if (!scenario) {
        throw new BadRequestException({
          code: 'SCENARIO_NOT_FOUND',
          message: 'Сценарий не найден',
        });
      }
      if (!scenario.isPublished) {
        throw new BadRequestException({
          code: 'SCENARIO_NOT_PUBLISHED',
          message: 'Сценарий должен быть опубликован',
        });
      }
    } else {
      throw new BadRequestException({
        code: 'SCENARIO_REQUIRED',
        message: 'Нельзя создать игру без сценария',
      });
    }

    // 7. Город и описание обязательны
    if (!data.city || data.city.trim().length === 0) {
      throw new BadRequestException({
        code: 'CITY_REQUIRED',
        message: 'Город обязателен',
      });
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new BadRequestException({
        code: 'DESCRIPTION_REQUIRED',
        message: 'Описание обязательно',
      });
    }

    // 8. Организатор имеет роль ORGANIZER
    const user = await this.prisma.user.findUnique({
      where: { id: organizerId },
      select: { roles: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден',
      });
    }
    if (!user.roles.includes('ORGANIZER') && !user.roles.includes('ADMIN')) {
      throw new ForbiddenException({
        code: 'NOT_ORGANIZER',
        message: 'Пользователь не имеет роли организатора',
      });
    }
  }

  private async validateUpdateGame(data: UpdateGameDto, gameId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { status: true, date: true, deletedAt: true },
    });

    if (!game || game.deletedAt) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    // Нельзя редактировать после открытия регистрации
    const editableStatuses: GameStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED'];
    if (!editableStatuses.includes(game.status)) {
      throw new BadRequestException({
        code: 'CANNOT_EDIT_AFTER_REGISTRATION',
        message: 'Нельзя редактировать игру после открытия регистрации',
      });
    }

    if (data.date) {
      const gameDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (gameDate < today) {
        throw new BadRequestException({
          code: 'GAME_IN_PAST',
          message: 'Дата игры не может быть в прошлом',
        });
      }
    }

    if (data.time && !/^\d{2}:\d{2}$/.test(data.time)) {
      throw new BadRequestException({
        code: 'INVALID_TIME',
        message: 'Время игры должно быть в формате HH:mm',
      });
    }

    if (data.duration !== undefined && data.duration <= 0) {
      throw new BadRequestException({
        code: 'INVALID_DURATION',
        message: 'Длительность игры должна быть больше 0',
      });
    }

    if (data.maxTeams !== undefined && data.maxTeams <= 0) {
      throw new BadRequestException({
        code: 'INVALID_MAX_TEAMS',
        message: 'Максимум команд должен быть больше 0',
      });
    }

    if (data.price !== undefined && data.price < 0) {
      throw new BadRequestException({
        code: 'INVALID_PRICE',
        message: 'Цена не может быть отрицательной',
      });
    }

    if (data.scenarioId) {
      const scenario = await this.prisma.scenario.findUnique({
        where: { id: data.scenarioId },
        select: { isPublished: true },
      });
      if (!scenario) {
        throw new BadRequestException({
          code: 'SCENARIO_NOT_FOUND',
          message: 'Сценарий не найден',
        });
      }
      if (!scenario.isPublished) {
        throw new BadRequestException({
          code: 'SCENARIO_NOT_PUBLISHED',
          message: 'Сценарий должен быть опубликован',
        });
      }
    }
  }

  // ============================================================
  // CRUD Methods
  // ============================================================

  async createGame(data: CreateGameDto, organizerId: string) {
    await this.validateCreateGame(data, organizerId);

    const slug = slugify(data.title);
    const shareLink = generateShareLink();

    const game = await this.prisma.game.create({
      data: {
        slug,
        title: data.title,
        description: data.description || '',
        city: data.city,
        address: data.address || null,
        date: new Date(data.date),
        time: data.time,
        duration: data.duration,
        price: data.price,
        maxTeams: data.maxTeams,
        shareLink,
        imageUrl: data.imageUrl || null,
        bannerUrl: data.bannerUrl || null,
        tags: data.tags || [],
        status: 'DRAFT',
        moderationStatus: 'PENDING',
        version: 1,
        autoStart: data.autoStart ?? false,
        autoStartDelay: data.autoStartDelay ?? 0,
        allowEarlyStart: data.allowEarlyStart ?? true,
        startBuffer: data.startBuffer ?? 15,
        allowLateRegistration: data.allowLateRegistration ?? false,
        organizerId,
        scenarioId: data.scenarioId,
      },
      include: {
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        scenario: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(`Game created: ${game.id} by organizer ${organizerId}`);

    return game;
  }

  async getGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      include: {
        organizer: {
          select: { id: true, name: true, avatarUrl: true },
        },
        scenario: {
          select: { id: true, name: true, description: true },
        },
        _count: {
          select: {
            gameTeams: true,
            reviews: true,
            gameComments: true,
            registrations: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    return game;
  }

  async updateGame(gameId: string, data: UpdateGameDto, userId: string) {
    await this.validateUpdateGame(data, gameId);

    const existing = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { version: true, organizerId: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    // Проверка ownership
    if (existing.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });
      if (!user?.roles.includes('ADMIN')) {
        throw new ForbiddenException({
          code: 'NOT_OWNER',
          message: 'Только организатор может редактировать игру',
        });
      }
    }

    const updateData: Prisma.GameUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = slugify(data.title);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.time !== undefined) updateData.time = data.time;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.maxTeams !== undefined) updateData.maxTeams = data.maxTeams;
    if (data.scenarioId !== undefined) updateData.scenarioId = data.scenarioId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.autoStart !== undefined) updateData.autoStart = data.autoStart;
    if (data.autoStartDelay !== undefined) updateData.autoStartDelay = data.autoStartDelay;
    if (data.allowEarlyStart !== undefined) updateData.allowEarlyStart = data.allowEarlyStart;
    if (data.startBuffer !== undefined) updateData.startBuffer = data.startBuffer;
    if (data.allowLateRegistration !== undefined) updateData.allowLateRegistration = data.allowLateRegistration;

    try {
      const game = await this.prisma.game.update({
        where: {
          id: gameId,
          version: existing.version, // Optimistic locking
        },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
        include: {
          organizer: {
            select: { id: true, name: true, avatarUrl: true },
          },
          scenario: {
            select: { id: true, name: true },
          },
        },
      });

      this.logger.log(`Game updated: ${gameId} (version ${existing.version} -> ${existing.version + 1})`);

      return game;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ConflictException({
            code: 'VERSION_CONFLICT',
            message: 'Конфликт версий. Игра была изменена другим пользователем. Обновите данные и повторите попытку.',
          });
        }
      }
      throw error;
    }
  }

  async deleteGame(gameId: string, userId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    // Проверка ownership
    if (game.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roles: true },
      });
      if (!user?.roles.includes('ADMIN')) {
        throw new ForbiddenException({
          code: 'NOT_OWNER',
          message: 'Только организатор может удалить игру',
        });
      }
    }

    // Нельзя удалить игру с командами (правило из раздела 12)
    if (game._count.registrations > 0) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_WITH_TEAMS',
        message: 'Нельзя удалить игру с зарегистрированными командами. Используйте отмену.',
      });
    }

    // Soft Delete
    await this.prisma.game.update({
      where: { id: gameId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Game soft-deleted: ${gameId}`);
  }

  // ============================================================
  // Public methods (сохранены из существующей реализации)
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
      moderationStatus: 'APPROVED',
      deletedAt: null,
      status: { notIn: ['DRAFT', 'PENDING', 'CANCELLED', 'ARCHIVED'] },
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
        lte: new Date(params.dateTo),
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
          slug: true,
          title: true,
          description: true,
          city: true,
          date: true,
          time: true,
          duration: true,
          price: true,
          maxTeams: true,
          shareLink: true,
          imageUrl: true,
          bannerUrl: true,
          tags: true,
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
        averageRating: 0,
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
        _count: {
          select: {
            gameTeams: true,
            reviews: true,
            gameComments: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const reviews = game.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : 0;

    const count = game._count || { gameTeams: 0, reviews: 0, gameComments: 0 };

    return {
      ...game,
      averageRating: Math.round(avgRating * 100) / 100,
      reviewsCount: count.reviews,
      teamsCount: count.gameTeams,
      commentsCount: count.gameComments,
    };
  }

  async findOnePublic(gameId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(gameId)) {
      throw new NotFoundException('Игра не найдена');
    }

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
            gameComments: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    const avgRating =
      game.reviews?.length > 0
        ? game.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / game.reviews.length
        : 0;

    const count = game._count || { gameTeams: 0, reviews: 0, gameComments: 0 };

    return {
      ...game,
      averageRating: Math.round(avgRating * 100) / 100,
      reviewsCount: count.reviews,
      teamsCount: count.gameTeams,
      commentsCount: count.gameComments,
    };
  }

  async findAll(params: {
    status?: string;
    city?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {
      publishedAt: { not: null },
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
          slug: true,
          title: true,
          description: true,
          city: true,
          date: true,
          time: true,
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
        averageRating: g._count.reviews > 0 ? g._count.reviews : 0,
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
            gameComments: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

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
      select: { id: true },
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
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.review.count({ where: { gameId } }),
    ]);

    return {
      data: reviews,
      meta: { total, limit: params.limit || 10, offset: params.offset || 0 },
    };
  }

  async getTeams(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.prisma.gameTeam.findMany({
      where: { gameId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getComments(gameId: string, params: { limit?: number; offset?: number }) {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { gameId },
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.comment.count({ where: { gameId } }),
    ]);

    return {
      data: comments,
      meta: { total, limit: params.limit || 20, offset: params.offset || 0 },
    };
  }

  async addComment(gameId: string, userId: string, text: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.prisma.comment.create({
      data: {
        gameId,
        userId,
        text,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  // ============================================================
  // Organizer methods
  // ============================================================

  async findMyGames(organizerId: string) {
    return this.prisma.game.findMany({
      where: { organizerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            gameTeams: true,
            registrations: true,
            reviews: true,
          },
        },
      },
    });
  }

  async submitForModeration(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    if (game.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_OWNER',
        message: 'Только организатор может отправить игру на модерацию',
      });
    }

    if (game.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Только черновик можно отправить на модерацию',
      });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });
  }

  // ============================================================
  // Admin methods
  // ============================================================

  async findPendingGames() {
    return this.prisma.game.findMany({
      where: {
        moderationStatus: 'PENDING',
        status: 'PENDING',
        deletedAt: null,
      },
      orderBy: { submittedAt: 'asc' },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        scenario: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async approveGame(gameId: string, moderatorId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    if (game.status !== 'PENDING') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Игра не находится на модерации',
      });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'APPROVED',
        moderationStatus: 'APPROVED',
        moderatedAt: new Date(),
        moderationComment: null,
      },
    });
  }

  async rejectGame(gameId: string, moderatorId: string, reason: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    if (game.status !== 'PENDING') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Игра не находится на модерации',
      });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'DRAFT',
        moderationStatus: 'REJECTED',
        moderatedAt: new Date(),
        moderationComment: reason,
      },
    });
  }
}
