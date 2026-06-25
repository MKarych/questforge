import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, $Enums } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { validateTransition, canCancel, canReschedule } from './state-machine/game-state-machine';

type GameStatus = $Enums.GameStatus;

// Slug generation
function slugify(text: string): string {
  // Транслитерация кириллицы в латиницу
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  };

  const base = text
    .toLowerCase()
    .split('')
    .map((ch) => translitMap[ch] || ch)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  // Добавляем короткий уникальный суффикс, чтобы избежать конфликтов
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

function generateShareLink(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Prisma GameStatus enum values cast helper
const GAME_STATUS = {
  DRAFT: 'DRAFT' as GameStatus,
  PUBLISHED: 'PUBLISHED' as GameStatus,
  REGISTRATION_OPEN: 'REGISTRATION_OPEN' as GameStatus,
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED' as GameStatus,
  LOBBY: 'LOBBY' as GameStatus,
  RUNNING: 'RUNNING' as GameStatus,
  FINISHED: 'FINISHED' as GameStatus,
  ARCHIVED: 'ARCHIVED' as GameStatus,
  CANCELLED: 'CANCELLED' as GameStatus,
  RESCHEDULED: 'RESCHEDULED' as GameStatus,
  HIDDEN: 'HIDDEN' as GameStatus,
  BLOCKED: 'BLOCKED' as GameStatus,
};

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

    // 6. Если сценарий указан — проверяем, что он существует и опубликован
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
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден',
      });
    }
    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
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

    // Нельзя редактировать игру после старта (RUNNING, FINISHED, ARCHIVED)
    const nonEditableStatuses = ['RUNNING', 'FINISHED', 'ARCHIVED'];
    if (nonEditableStatuses.includes(game.status)) {
      throw new BadRequestException({
        code: 'CANNOT_EDIT_AFTER_START',
        message: 'Нельзя редактировать игру после начала игры',
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
        status: GAME_STATUS.PUBLISHED,
        version: 1,
        publishedAt: new Date(),
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
            comments: true,
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
        select: { role: true },
      });
      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException({
          code: 'NOT_OWNER',
          message: 'Только организатор может редактировать игру',
        });
      }
    }

    const updateData: Record<string, unknown> = {};

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
        where: { id: gameId },
        data: {
          ...updateData,
          version: existing.version + 1,
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

      this.logger.log(`Game updated: ${gameId} (version ${existing.version} -> ${game.version})`);

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
        select: { role: true },
      });
      if (user?.role !== 'ADMIN') {
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
      deletedAt: null,
      status: { notIn: [$Enums.GameStatus.DRAFT, $Enums.GameStatus.CANCELLED, $Enums.GameStatus.ARCHIVED, $Enums.GameStatus.HIDDEN, $Enums.GameStatus.BLOCKED] },
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
            comments: true,
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

    const count = game._count || { gameTeams: 0, reviews: 0, comments: 0 };

    return {
      ...game,
      averageRating: Math.round(avgRating * 100) / 100,
      reviewsCount: count.reviews,
      teamsCount: count.gameTeams,
      commentsCount: count.comments,
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
            comments: true,
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
            comments: true,
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
        where: { gameId, deletedAt: null },
        take: params.limit || 20,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          text: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.comment.count({ where: { gameId, deletedAt: null } }),
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

  async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    // ADMIN и MODERATOR могут удалять любые комментарии
    // Автор может удалять только свой комментарий
    const isModerator = userRole === 'ADMIN' || userRole === 'MODERATOR';
    const isOwner = comment.userId === userId;

    if (!isModerator && !isOwner) {
      throw new ForbiddenException('Недостаточно прав для удаления комментария');
    }

    // Soft delete
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async updateComment(commentId: string, userId: string, text: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    // Только автор может редактировать свой комментарий
    if (comment.userId !== userId) {
      throw new ForbiddenException('Недостаточно прав для редактирования комментария');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { text },
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
    const games = await this.prisma.game.findMany({
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

    return {
      data: games.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        city: g.city,
        date: g.date,
        time: g.time,
        duration: g.duration,
        price: g.price,
        maxTeams: g.maxTeams,
        shareLink: g.shareLink,
        status: g.status,
        imageUrl: g.imageUrl,
        publishedAt: g.publishedAt,
        organizer: {
          id: g.organizerId,
          name: '',
          avatarUrl: null,
        },
        averageRating: 0,
        reviewsCount: g._count.reviews,
        teamsCount: g._count.gameTeams,
      })),
      meta: {
        total: games.length,
        limit: games.length,
        offset: 0,
      },
    };
  }

  // ============================================================
  // Admin / Moderation methods (пост-модерация)
  // ============================================================

  /**
   * adminFindAll: получить все игры (для админ-панели).
   */
  async adminFindAll(params: {
    status?: string;
    city?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }
    if (params.city) {
      where.city = params.city;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          scenario: {
            select: { id: true, name: true },
          },
          _count: {
            select: { registrations: true, gameTeams: true, reviews: true },
          },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return { data: games, meta: { total, limit: params.limit || 50, offset: params.offset || 0 } };
  }

  /**
   * adminHideGame: PUBLISHED → HIDDEN
   * Скрыть игру из каталога (по жалобе или на время).
   */
  async adminHideGame(gameId: string, moderatorId: string, comment?: string) {
    const game = await this.findGameOrThrow(gameId);

    if (game.status === GAME_STATUS.HIDDEN) {
      throw new BadRequestException({ code: 'ALREADY_HIDDEN', message: 'Игра уже скрыта' });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.HIDDEN,
        moderationComment: comment || null,
      },
    });
  }

  /**
   * adminUnhideGame: HIDDEN → PUBLISHED
   * Вернуть скрытую игру в каталог.
   */
  async adminUnhideGame(gameId: string, moderatorId: string) {
    const game = await this.findGameOrThrow(gameId);

    if (game.status !== GAME_STATUS.HIDDEN) {
      throw new BadRequestException({ code: 'NOT_HIDDEN', message: 'Игра не скрыта' });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.PUBLISHED,
        moderationComment: null,
      },
    });
  }

  /**
   * adminBlockGame: любой статус → BLOCKED
   * Заблокировать игру (нарушение правил).
   */
  async adminBlockGame(gameId: string, moderatorId: string, comment?: string) {
    const game = await this.findGameOrThrow(gameId);

    if (game.status === GAME_STATUS.BLOCKED) {
      throw new BadRequestException({ code: 'ALREADY_BLOCKED', message: 'Игра уже заблокирована' });
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.BLOCKED,
        moderationComment: comment || null,
      },
    });
  }

  /**
   * adminDeleteGame: удалить любую игру (для админа/модератора).
   */
  async adminDeleteGame(gameId: string, moderatorId: string) {
    const game = await this.findGameOrThrow(gameId);

    await this.prisma.game.update({
      where: { id: gameId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Game admin-deleted: ${gameId} by moderator ${moderatorId}`);
  }

  // ============================================================
  // State Machine Methods
  // ============================================================

  /**
   * publishGame: DRAFT → PUBLISHED
   * Публикация игры (не требует сценария).
   */
  async publishGame(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrModerator(game, userId);

    validateTransition(game.status, GAME_STATUS.PUBLISHED);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  /**
   * openRegistration: PUBLISHED → REGISTRATION_OPEN
   * Открытие регистрации команд.
   */
  async openRegistration(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrModerator(game, userId);

    validateTransition(game.status, GAME_STATUS.REGISTRATION_OPEN);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.REGISTRATION_OPEN,
      },
    });
  }

  /**
   * closeRegistration: REGISTRATION_OPEN → REGISTRATION_CLOSED
   * Закрытие регистрации команд.
   */
  async closeRegistration(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    validateTransition(game.status, GAME_STATUS.REGISTRATION_CLOSED);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.REGISTRATION_CLOSED,
      },
    });
  }

  /**
   * moveToLobby: REGISTRATION_CLOSED → LOBBY
   * Переход в лобби (ожидание старта).
   */
  async moveToLobby(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    validateTransition(game.status, GAME_STATUS.LOBBY);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.LOBBY,
      },
    });
  }

  /**
   * startGame: LOBBY → RUNNING
   * Запуск игры. Проверяет:
   * - Статус LOBBY
   * - Если autoStart = false → ручной старт (организатор)
   * - Если autoStart = true → проверка времени
   * - Организатор может запустить раньше, если все команды READY
   * - После стартового времени организатор может запустить в любом случае
   */
  async startGame(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    validateTransition(game.status, GAME_STATUS.RUNNING);

    // Проверка: минимум 1 зарегистрированная команда
    const registrationsCount = await this.prisma.gameRegistration.count({
      where: { gameId },
    });

    if (registrationsCount === 0) {
      throw new BadRequestException({
        code: 'NO_TEAMS_REGISTERED',
        message: 'Необходимо зарегистрировать хотя бы одну команду перед запуском игры',
      });
    }

    // Вычисляем время старта: date + time
    const startTime = this.calculateStartTime(game.date, game.time);

    // Проверка: игра может стартовать только после установленной даты и времени (правило 15)
    const now = new Date();
    const canStartAfterTime = now >= startTime;

    if (!canStartAfterTime) {
      // Если время ещё не пришло — проверяем, можно ли запустить раньше
      if (!game.allowEarlyStart) {
        throw new BadRequestException({
          code: 'CANNOT_START_BEFORE_TIME',
          message: `Игра может стартовать не раньше ${game.time}`,
        });
      }

      // Проверка: все команды готовы (правило 16)
      const allReady = await this.areAllTeamsReady(gameId);
      if (!allReady) {
        throw new BadRequestException({
          code: 'TEAMS_NOT_READY',
          message: 'Не все команды готовы. Дождитесь стартового времени или подтверждения от всех команд.',
        });
      }
    }

    // Если autoStart = false, но время пришло — организатор может запустить вручную (правило 17)
    // Если autoStart = true — тоже запускаем (правило 18)

    this.logger.log(`Game starting: ${gameId} by user ${userId}`);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.RUNNING,
        startedAt: new Date(),
      },
    });
  }

  /**
   * finishGame: RUNNING → FINISHED
   * Завершение игры организатором.
   */
  async finishGame(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    validateTransition(game.status, GAME_STATUS.FINISHED);

    this.logger.log(`Game finished: ${gameId} by user ${userId}`);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.FINISHED,
        finishedAt: new Date(),
      },
    });
  }

  /**
   * cancelGame: любой статус → CANCELLED (кроме FINISHED, ARCHIVED)
   * Отмена игры.
   */
  async cancelGame(gameId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    if (!canCancel(game.status)) {
      throw new BadRequestException({
        code: 'CANNOT_CANCEL',
        message: `Нельзя отменить игру в статусе ${game.status}`,
      });
    }

    validateTransition(game.status, GAME_STATUS.CANCELLED);

    // Domain Event: получаем список зарегистрированных команд для уведомления
    const registrations = await this.prisma.gameRegistration.findMany({
      where: { gameId },
      select: { teamId: true },
    });

    this.logger.log(`[Domain Event] game.cancelled — game ${gameId} cancelled by user ${userId}`);
    if (registrations.length > 0) {
      this.logger.log(
        `[Domain Event] game.cancelled — notifications to ${registrations.length} teams: ${registrations.map((r) => r.teamId).join(', ')}`,
      );
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.CANCELLED,
      },
    });
  }

  /**
   * rescheduleGame: PUBLISHED/REGISTRATION_OPEN/REGISTRATION_CLOSED/LOBBY → RESCHEDULED
   * Перенос игры с новой датой/временем.
   */
  async rescheduleGame(gameId: string, userId: string, newDate: string, newTime: string) {
    const game = await this.findGameOrThrow(gameId);

    this.checkOwnershipOrAdmin(game, userId);

    if (!canReschedule(game.status)) {
      throw new BadRequestException({
        code: 'CANNOT_RESCHEDULE',
        message: `Нельзя перенести игру в статусе ${game.status}`,
      });
    }

    validateTransition(game.status, GAME_STATUS.RESCHEDULED);

    // Валидация новой даты
    const newDateObj = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDateObj < today) {
      throw new BadRequestException({
        code: 'GAME_IN_PAST',
        message: 'Новая дата игры не может быть в прошлом',
      });
    }

    // Валидация времени
    if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) {
      throw new BadRequestException({
        code: 'INVALID_TIME',
        message: 'Время игры должно быть в формате HH:mm',
      });
    }

    // Domain Event: получаем список зарегистрированных команд для уведомления
    const registrations = await this.prisma.gameRegistration.findMany({
      where: { gameId },
      select: { teamId: true },
    });

    this.logger.log(
      `[Domain Event] game.rescheduled — game ${gameId} rescheduled by user ${userId} to ${newDate} ${newTime} (was: ${game.date.toISOString()} ${game.time})`,
    );
    if (registrations.length > 0) {
      this.logger.log(
        `[Domain Event] game.rescheduled — notifications to ${registrations.length} teams: ${registrations.map((r) => r.teamId).join(', ')}`,
      );
    }

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GAME_STATUS.RESCHEDULED,
        date: newDateObj,
        time: newTime,
      },
    });
  }

  /**
   * getTimer: возвращает информацию о таймере до старта.
   */
  async getTimer(gameId: string) {
    const game = await this.findGameOrThrow(gameId);

    const startTime = this.calculateStartTime(game.date, game.time);
    const now = new Date();
    const timeUntilStart = startTime.getTime() - now.getTime();

    // Проверка: можно ли стартовать
    let canStartNow = false;

    if (game.status === GAME_STATUS.LOBBY) {
      if (timeUntilStart <= 0) {
        // Время пришло
        canStartNow = true;
      } else if (game.allowEarlyStart) {
        // Проверяем, все ли команды готовы
        const allReady = await this.areAllTeamsReady(gameId);
        canStartNow = allReady;
      }
    }

    return {
      canStart: canStartNow,
      timeUntilStart: Math.max(0, timeUntilStart),
      status: game.status,
      startTime: startTime.toISOString(),
      now: now.toISOString(),
    };
  }

  /**
   * canStart: проверяет, можно ли запустить игру.
   */
  async canStart(gameId: string) {
    const game = await this.findGameOrThrow(gameId);

    if (game.status !== GAME_STATUS.LOBBY) {
      return {
        canStart: false,
        reason: `Игра в статусе ${game.status}. Ожидается статус LOBBY.`,
      };
    }

    const startTime = this.calculateStartTime(game.date, game.time);
    const now = new Date();
    const timeUntilStart = startTime.getTime() - now.getTime();

    if (timeUntilStart <= 0) {
      return {
        canStart: true,
        reason: null,
        timeUntilStart: 0,
      };
    }

    // Время ещё не пришло
    if (game.allowEarlyStart) {
      const allReady = await this.areAllTeamsReady(gameId);
      if (allReady) {
        return {
          canStart: true,
          reason: null,
          timeUntilStart,
        };
      }
      return {
        canStart: false,
        reason: 'Время старта ещё не наступило. Не все команды готовы.',
        timeUntilStart,
      };
    }

    return {
      canStart: false,
      reason: `Время старта ещё не наступило. Осталось ${Math.ceil(timeUntilStart / 1000)} сек.`,
      timeUntilStart,
    };
  }

  // ============================================================
  // Registration Methods (Раздел 9)
  // ============================================================

  /**
   * registerTeam: регистрация команды на игру.
   * Проверки: статус PUBLISHED или REGISTRATION_OPEN, maxTeams, команда не зарегистрирована.
   * Согласно 56-gameplay-flow.md: в статусе PUBLISHED регистрация должна быть доступна.
   */
  async registerTeam(gameId: string, teamId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    // Проверка: статус PUBLISHED или REGISTRATION_OPEN
    if (game.status !== GAME_STATUS.REGISTRATION_OPEN && game.status !== GAME_STATUS.PUBLISHED) {
      throw new BadRequestException({
        code: 'REGISTRATION_CLOSED',
        message: 'Регистрация на эту игру закрыта',
      });
    }

    // Проверка: команда существует
    const team = await this.prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
    });
    if (!team) {
      throw new NotFoundException({
        code: 'TEAM_NOT_FOUND',
        message: 'Команда не найдена',
      });
    }

    // Проверка: команда не зарегистрирована
    const existing = await this.prisma.gameRegistration.findUnique({
      where: { gameId_teamId: { gameId, teamId } },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'TEAM_ALREADY_REGISTERED',
        message: 'Команда уже зарегистрирована на эту игру',
      });
    }

    // Проверка: maxTeams не превышен
    const registrationsCount = await this.prisma.gameRegistration.count({
      where: { gameId },
    });
    if (registrationsCount >= game.maxTeams) {
      throw new BadRequestException({
        code: 'GAME_FULL',
        message: 'Все места заняты',
      });
    }

    const registration = await this.prisma.gameRegistration.create({
      data: {
        gameId,
        teamId,
        status: 'REGISTERED',
      },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    this.logger.log(`Team ${teamId} registered for game ${gameId} by user ${userId}`);

    return registration;
  }

  /**
   * registerTeamByName: регистрация команды по названию (создаёт новую команду).
   * Проверки: статус PUBLISHED или REGISTRATION_OPEN, maxTeams, команда с таким названием не зарегистрирована.
   * Согласно 56-gameplay-flow.md: в статусе PUBLISHED регистрация должна быть доступна.
   */
  async registerTeamByName(gameId: string, teamName: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    // Проверка: статус PUBLISHED или REGISTRATION_OPEN
    if (game.status !== GAME_STATUS.REGISTRATION_OPEN && game.status !== GAME_STATUS.PUBLISHED) {
      throw new BadRequestException({
        code: 'REGISTRATION_CLOSED',
        message: 'Регистрация на эту игру закрыта',
      });
    }

    // Проверка: название команды не пустое
    if (!teamName || teamName.trim().length === 0) {
      throw new BadRequestException({
        code: 'TEAM_NAME_REQUIRED',
        message: 'Название команды обязательно',
      });
    }

    // Проверка: maxTeams не превышен
    const registrationsCount = await this.prisma.gameRegistration.count({
      where: { gameId },
    });
    if (registrationsCount >= game.maxTeams) {
      throw new BadRequestException({
        code: 'GAME_FULL',
        message: 'Все места заняты',
      });
    }

    // Проверка: команда с таким названием уже зарегистрирована на эту игру
    const existingTeamByName = await this.prisma.team.findFirst({
      where: {
        name: teamName.trim(),
        deletedAt: null,
        registrations: {
          some: { gameId },
        },
      },
    });
    if (existingTeamByName) {
      throw new BadRequestException({
        code: 'TEAM_NAME_ALREADY_REGISTERED',
        message: 'Команда с таким названием уже зарегистрирована на эту игру',
      });
    }

    // Создаём новую команду
    const slug = slugify(teamName);
    const team = await this.prisma.team.create({
      data: {
        name: teamName.trim(),
        slug,
        captainId: userId,
        members: {
          create: {
            userId,
            role: 'CAPTAIN',
          },
        },
      },
    });

    // Регистрируем команду на игру
    const registration = await this.prisma.gameRegistration.create({
      data: {
        gameId,
        teamId: team.id,
        status: 'REGISTERED',
      },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Также добавляем в gameTeams
    await this.prisma.gameTeam.create({
      data: {
        gameId,
        teamId: team.id,
      },
    });

    this.logger.log(`Team "${team.name}" (${team.id}) registered for game ${gameId} by user ${userId}`);

    return registration;
  }

  /**
   * unregisterTeam: отмена регистрации команды.
   */
  async unregisterTeam(gameId: string, teamId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    const registration = await this.prisma.gameRegistration.findUnique({
      where: { gameId_teamId: { gameId, teamId } },
    });

    if (!registration) {
      throw new NotFoundException({
        code: 'TEAM_NOT_FOUND',
        message: 'Команда не зарегистрирована на эту игру',
      });
    }

    await this.prisma.gameRegistration.delete({
      where: { id: registration.id },
    });

    this.logger.log(`Team ${teamId} unregistered from game ${gameId} by user ${userId}`);
  }

  /**
   * setTeamReady: команда нажимает "Готов".
   * Проверка: команда зарегистрирована.
   */
  async setTeamReady(gameId: string, teamId: string, userId: string) {
    const game = await this.findGameOrThrow(gameId);

    const registration = await this.prisma.gameRegistration.findUnique({
      where: { gameId_teamId: { gameId, teamId } },
    });

    if (!registration) {
      throw new NotFoundException({
        code: 'TEAM_NOT_FOUND',
        message: 'Команда не зарегистрирована на эту игру',
      });
    }

    const updated = await this.prisma.gameRegistration.update({
      where: { id: registration.id },
      data: {
        status: 'READY',
        readyAt: new Date(),
      },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    this.logger.log(`Team ${teamId} is ready for game ${gameId}`);

    return updated;
  }

  /**
   * getTeamsStatus: получить статусы всех команд.
   */
  async getTeamsStatus(gameId: string) {
    const game = await this.findGameOrThrow(gameId);

    const registrations = await this.prisma.gameRegistration.findMany({
      where: { gameId },
      include: {
        team: {
          select: { id: true, name: true, slug: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return registrations.map((r) => ({
      teamId: r.teamId,
      team: r.team,
      status: r.status,
      readyAt: r.readyAt,
      registeredAt: r.createdAt,
    }));
  }

  // ============================================================
  // Review Methods (Раздел 1 — Отзывы)
  // ============================================================

  /**
   * addReview: добавить отзыв на игру.
   * Правила:
   * - Отзыв доступен только после завершения игры (status: FINISHED)
   * - Игроки, участвовавшие в игре, могут оставить отзыв
   * - Организатор не может оставить отзыв на свою игру
   */
  async addReview(gameId: string, userId: string, rating: number, text?: string) {
    const game = await this.findGameOrThrow(gameId);

    // Проверка: игра завершена
    if (game.status !== GAME_STATUS.FINISHED) {
      throw new BadRequestException({
        code: 'GAME_NOT_FINISHED',
        message: 'Отзыв можно оставить только после завершения игры',
      });
    }

    // Проверка: организатор не может оставить отзыв на свою игру
    if (game.organizerId === userId) {
      throw new ForbiddenException({
        code: 'ORGANIZER_CANNOT_REVIEW',
        message: 'Организатор не может оставить отзыв на свою игру',
      });
    }

    // Проверка: пользователь участвовал в игре (через команду)
    const userTeams = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const userTeamIds = userTeams.map((t) => t.teamId);

    if (userTeamIds.length === 0) {
      throw new ForbiddenException({
        code: 'NOT_PARTICIPANT',
        message: 'Только участники игры могут оставить отзыв',
      });
    }

    const registration = await this.prisma.gameRegistration.findFirst({
      where: {
        gameId,
        teamId: { in: userTeamIds },
      },
    });

    if (!registration) {
      throw new ForbiddenException({
        code: 'NOT_PARTICIPANT',
        message: 'Только участники игры могут оставить отзыв',
      });
    }

    // Проверка: пользователь уже оставил отзыв
    const existingReview = await this.prisma.review.findFirst({
      where: { gameId, userId },
    });

    if (existingReview) {
      throw new BadRequestException({
        code: 'ALREADY_REVIEWED',
        message: 'Вы уже оставили отзыв на эту игру',
      });
    }

    // Валидация рейтинга
    if (rating < 1 || rating > 5) {
      throw new BadRequestException({
        code: 'INVALID_RATING',
        message: 'Рейтинг должен быть от 1 до 5',
      });
    }

    const review = await this.prisma.review.create({
      data: {
        gameId,
        userId,
        rating,
        text: text || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    this.logger.log(`Review added: game ${gameId} by user ${userId}, rating ${rating}`);

    return review;
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private async findGameOrThrow(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId, deletedAt: null },
    });

    if (!game) {
      throw new NotFoundException({
        code: 'GAME_NOT_FOUND',
        message: 'Игра не найдена',
      });
    }

    return game;
  }

  private async checkOwnershipOrAdmin(game: { organizerId: string }, userId: string): Promise<void> {
    if (game.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
        throw new ForbiddenException({
          code: 'NOT_OWNER',
          message: 'Только организатор, модератор или админ может выполнить это действие',
        });
      }
    }
  }

  private async checkOwnershipOrModerator(game: { organizerId: string }, userId: string): Promise<void> {
    if (game.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
        throw new ForbiddenException({
          code: 'NOT_OWNER',
          message: 'Только организатор, модератор или админ может выполнить это действие',
        });
      }
    }
  }

  private calculateStartTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);
    return startTime;
  }

  private async areAllTeamsReady(gameId: string): Promise<boolean> {
    const registrations = await this.prisma.gameRegistration.findMany({
      where: { gameId },
      select: { status: true },
    });

    if (registrations.length === 0) {
      return false;
    }

    return registrations.every((r) => r.status === 'READY');
  }
}
