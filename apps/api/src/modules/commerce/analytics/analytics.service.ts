import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnalyticsPeriod, EarningStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Обновить статистику листинга (views, favorites, sales) на основе реальных данных
   */
  async updateListingStats(listingId: string): Promise<void> {
    const [views, favorites, sales, reviews] = await Promise.all([
      this.prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { views: true },
      }),
      this.prisma.favoriteListing.count({
        where: { listingId },
      }),
      this.prisma.purchase.count({
        where: { listingId, status: 'COMPLETED' },
      }),
      this.prisma.marketplaceReview.aggregate({
        where: { listingId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        sales,
        favorites,
        avgRating: reviews._avg.rating ?? 0,
        reviewsCount: reviews._count,
      },
    });

    this.logger.debug(`Stats updated for listing ${listingId}`);
  }

  /**
   * Записать аналитику за период (создать или обновить существующую запись)
   */
  async recordAnalytics(
    listingId: string,
    period: AnalyticsPeriod,
    date: Date,
  ): Promise<void> {
    const [views, favorites, sales, reviews] = await Promise.all([
      this.prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        select: { views: true },
      }),
      this.prisma.favoriteListing.count({
        where: { listingId },
      }),
      this.prisma.purchase.count({
        where: { listingId, status: 'COMPLETED' },
      }),
      this.prisma.marketplaceReview.aggregate({
        where: { listingId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const totalViews = views?.views ?? 0;
    const conversionRate = totalViews > 0 ? sales / totalViews : 0;

    await this.prisma.marketplaceAnalytics.upsert({
      where: {
        listingId_period_date: { listingId, period, date },
      },
      create: {
        listingId,
        period,
        date,
        views: totalViews,
        favorites,
        sales,
        conversionRate,
        avgRating: reviews._avg.rating ?? 0,
        reviewsCount: reviews._count,
      },
      update: {
        views: totalViews,
        favorites,
        sales,
        conversionRate,
        avgRating: reviews._avg.rating ?? 0,
        reviewsCount: reviews._count,
      },
    });

    this.logger.debug(`Analytics recorded for listing ${listingId} (${period})`);
  }

  /**
   * Получить аналитику для автора по его листингам
   */
  async getAuthorAnalytics(
    authorId: string,
    period: AnalyticsPeriod = AnalyticsPeriod.DAY,
    limit = 30,
    offset = 0,
  ) {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { authorId, deletedAt: null },
      select: { id: true },
    });

    const listingIds = listings.map(l => l.id);

    if (listingIds.length === 0) {
      return { items: [], total: 0, limit, offset };
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceAnalytics.findMany({
        where: {
          listingId: { in: listingIds },
          period,
        },
        include: {
          listing: {
            select: { id: true, title: true },
          },
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.marketplaceAnalytics.count({
        where: {
          listingId: { in: listingIds },
          period,
        },
      }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Получить аналитику для конкретного листинга
   */
  async getListingAnalytics(
    listingId: string,
    period?: AnalyticsPeriod,
    limit = 30,
    offset = 0,
  ) {
    const where: Record<string, unknown> = { listingId };
    if (period) {
      where.period = period;
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceAnalytics.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.marketplaceAnalytics.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Получить сводную аналитику для автора (агрегированные метрики)
   */
  async getAuthorAnalyticsSummary(authorId: string) {
    const listings = await this.prisma.marketplaceListing.findMany({
      where: { authorId, deletedAt: null },
      select: { id: true, views: true, sales: true, favorites: true, avgRating: true, reviewsCount: true },
    });

    const totalViews = listings.reduce((sum, l) => sum + l.views, 0);
    const totalSales = listings.reduce((sum, l) => sum + l.sales, 0);
    const totalFavorites = listings.reduce((sum, l) => sum + l.favorites, 0);
    const totalReviews = listings.reduce((sum, l) => sum + l.reviewsCount, 0);
    const avgRating =
      listings.length > 0
        ? listings.reduce((sum, l) => sum + l.avgRating, 0) / listings.length
        : 0;

    // Доходы
    const earnings = await this.prisma.authorEarning.aggregate({
      where: { authorId, status: EarningStatus.AVAILABLE },
      _sum: { amount: true },
    });

    // Ожидающие выплаты
    const pendingPayouts = await this.prisma.payout.aggregate({
      where: { authorId, status: 'PENDING' },
      _sum: { amount: true },
    });

    return {
      listingsCount: listings.length,
      totalViews,
      totalSales,
      totalFavorites,
      totalReviews,
      avgRating,
      totalEarnings: Number((earnings._sum ?? {}).amount ?? 0),
      pendingPayouts: Number(pendingPayouts._sum.amount ?? 0),
    };
  }
}