import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MarketplaceQueryDto, CreateListingDto, UpdateListingDto } from '../dto/marketplace.dto';
import { ListingStatus, Prisma } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Публичные методы
  // ============================================================

  /**
   * Поиск и фильтрация листингов
   */
  async search(query: MarketplaceQueryDto) {
    const {
      search,
      category,
      tags,
      licenseType,
      minPrice,
      maxPrice,
      sort = 'newest',
      limit = 20,
      offset = 0,
    } = query;

    const where: Prisma.MarketplaceListingWhereInput = {
      status: ListingStatus.PUBLISHED,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (licenseType) {
      where.licenseType = licenseType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    let orderBy: Prisma.MarketplaceListingOrderByWithRelationInput;
    switch (sort) {
      case 'popular':
        orderBy = { sales: 'desc' };
        break;
      case 'rating':
        orderBy = { avgRating: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      default:
        orderBy = { publishedAt: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
          scenario: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Получить листинг по ID
   */
  async getById(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, rating: true },
        },
        scenario: {
          select: { id: true, name: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Листинг не найден');
    }

    return listing;
  }

  /**
   * Инкремент просмотров
   */
  async incrementViews(id: string) {
    await this.prisma.marketplaceListing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  /**
   * Получить категории (уникальные значения из существующих листингов)
   */
  async getCategories() {
    const result = await this.prisma.marketplaceListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        category: { not: null },
        deletedAt: null,
      },
      select: { category: true },
      distinct: ['category'],
    });
    return result.map((r) => r.category).filter(Boolean);
  }

  /**
   * Получить типы лицензий (уникальные)
   */
  async getLicenseTypes() {
    const result = await this.prisma.marketplaceListing.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { licenseType: true },
      distinct: ['licenseType'],
    });
    return result.map((r) => r.licenseType);
  }

  // ============================================================
  // Авторские методы
  // ============================================================

  /**
   * Создать листинг
   */
  async create(authorId: string, dto: CreateListingDto) {
    // Проверяем, что сценарий принадлежит автору
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: dto.scenarioId },
      select: { id: true, authorId: true },
    });

    if (!scenario) {
      throw new NotFoundException('Сценарий не найден');
    }

    if (scenario.authorId !== authorId) {
      throw new ForbiddenException('Вы не являетесь автором этого сценария');
    }

    // Проверяем, что листинг для этого сценария ещё не создан
    const existing = await this.prisma.marketplaceListing.findUnique({
      where: { scenarioId: dto.scenarioId },
    });

    if (existing) {
      throw new BadRequestException('Листинг для этого сценария уже существует');
    }

    const listing = await this.prisma.marketplaceListing.create({
      data: {
        scenarioId: dto.scenarioId,
        authorId,
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        category: dto.category,
        tags: dto.tags ?? [],
        coverUrl: dto.coverUrl,
        bannerUrl: dto.bannerUrl,
        price: dto.price,
        licenseType: dto.licenseType ?? 'SINGLE',
        updatePolicy: dto.updatePolicy ?? 'ALL_UPDATES',
        status: ListingStatus.DRAFT,
      },
    });

    this.logger.log(`Listing created: ${listing.id} by author ${authorId}`);
    return listing;
  }

  /**
   * Обновить листинг
   */
  async update(listingId: string, authorId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.authorId !== authorId) {
      throw new ForbiddenException('Вы не являетесь автором этого листинга');
    }

    if (listing.status === ListingStatus.PUBLISHED) {
      throw new BadRequestException('Нельзя редактировать опубликованный листинг. Создайте новую версию.');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.shortDescription !== undefined && { shortDescription: dto.shortDescription }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.licenseType !== undefined && { licenseType: dto.licenseType }),
        ...(dto.updatePolicy !== undefined && { updatePolicy: dto.updatePolicy }),
      },
    });

    return updated;
  }

  /**
   * Опубликовать листинг
   */
  async publish(listingId: string, authorId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        scenario: {
          select: { id: true },
          include: {
            versions: {
              where: { status: 'PUBLISHED' },
              orderBy: { version: 'desc' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.authorId !== authorId) {
      throw new ForbiddenException('Вы не являетесь автором этого листинга');
    }

    if (listing.status === ListingStatus.PUBLISHED) {
      throw new BadRequestException('Листинг уже опубликован');
    }

    // Проверяем, что есть опубликованная версия сценария
    const publishedVersion = listing.scenario.versions[0];
    if (!publishedVersion) {
      throw new BadRequestException('Необходимо опубликовать хотя бы одну версию сценария');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.PUBLISHED,
        publishedVersionId: publishedVersion.id,
        publishedAt: new Date(),
      },
    });

    this.logger.log(`Listing published: ${listingId}`);
    return updated;
  }

  /**
   * Снять с публикации
   */
  async unpublish(listingId: string, authorId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.authorId !== authorId) {
      throw new ForbiddenException('Вы не являетесь автором этого листинга');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.DRAFT,
        publishedAt: null,
      },
    });

    this.logger.log(`Listing unpublished: ${listingId}`);
    return updated;
  }

  /**
   * Список листингов автора
   */
  async getAuthorListings(authorId: string) {
    return this.prisma.marketplaceListing.findMany({
      where: { authorId, deletedAt: null },
      include: {
        scenario: {
          select: { id: true, name: true },
        },
        _count: {
          select: { purchases: true, licenses: true, favoritedBy: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Продажи автора
   */
  async getAuthorSales(authorId: string) {
    return this.prisma.purchase.findMany({
      where: {
        listing: { authorId },
        status: 'COMPLETED',
      },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Доходы автора
   */
  async getAuthorEarnings(authorId: string) {
    const earnings = await this.prisma.authorEarning.findMany({
      where: { authorId },
      include: {
        purchase: {
          select: {
            id: true,
            listingSnapshotTitle: true,
            listingSnapshotPrice: true,
            createdAt: true,
          },
        },
        payout: {
          select: { id: true, status: true, processedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totals = await this.prisma.authorEarning.aggregate({
      where: { authorId },
      _sum: { amount: true, commission: true, royalty: true },
    });

    return {
      earnings,
      totals: {
        totalAmount: totals._sum.amount ?? 0,
        totalCommission: totals._sum.commission ?? 0,
        totalRoyalty: totals._sum.royalty ?? 0,
      },
    };
  }

  /**
   * Аналитика автора
   */
  async getAuthorAnalytics(authorId: string) {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { authorId, deletedAt: null },
      select: { id: true, title: true, views: true, favorites: true, sales: true, avgRating: true, reviewsCount: true },
    });

    const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
    const totalSales = listings.reduce((sum, l) => sum + l.sales, 0);
    const totalFavorites = listings.reduce((sum, l) => sum + l.favorites, 0);

    return {
      listings,
      totalViews,
      totalSales,
      totalFavorites,
      listingCount: listings.length,
    };
  }

  // ============================================================
  // Админские методы
  // ============================================================

  /**
   * Модерация листинга
   */
  async moderate(listingId: string, status: ListingStatus, comment?: string, moderatorId?: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Листинг не найден');
    }

    const updated = await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status,
        moderationComment: comment,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        ...(status === ListingStatus.PUBLISHED && { publishedAt: new Date() }),
      },
    });

    this.logger.log(`Listing ${listingId} moderated to ${status} by ${moderatorId}`);
    return updated;
  }

  /**
   * Список листингов на модерацию
   */
  async getPendingModeration() {
    return this.prisma.marketplaceListing.findMany({
      where: { status: ListingStatus.PENDING, deletedAt: null },
      include: {
        author: { select: { id: true, username: true } },
        scenario: { select: { id: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // ============================================================
  // Избранное
  // ============================================================

  /**
   * Добавить листинг в избранное
   */
  async addFavorite(userId: string, listingId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Листинг не найден');
    }

    const existing = await this.prisma.favoriteListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      return existing;
    }

    const [favorite] = await this.prisma.$transaction([
      this.prisma.favoriteListing.create({
        data: { userId, listingId },
      }),
      this.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { favorites: { increment: 1 } },
      }),
    ]);

    return favorite;
  }

  /**
   * Удалить листинг из избранного
   */
  async removeFavorite(userId: string, listingId: string) {
    const existing = await this.prisma.favoriteListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (!existing) {
      throw new NotFoundException('Листинг не найден в избранном');
    }

    await this.prisma.$transaction([
      this.prisma.favoriteListing.delete({
        where: { id: existing.id },
      }),
      this.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { favorites: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  /**
   * Получить избранные листинги пользователя
   */
  async getUserFavorites(userId: string) {
    const favorites = await this.prisma.favoriteListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            scenario: {
              select: { id: true, name: true },
            },
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(f => f.listing);
  }

  /**
   * Получить листинг по scenarioId
   */
  async getListingByScenarioId(scenarioId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { scenarioId },
      include: {
        scenario: {
          select: { id: true, name: true, version: true },
        },
      },
    });

    if (!listing || listing.deletedAt) {
      return null;
    }

    return listing;
  }
}