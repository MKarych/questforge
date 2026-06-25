import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать отзыв на листинг (только после покупки и хотя бы одного запуска)
   */
  async createReview(listingId: string, userId: string, rating: number, text?: string) {
    // Проверяем листинг
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        scenarioId: true,
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Листинг не найден');
    }

    // Проверяем, что пользователь купил этот сценарий
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        listingId,
        buyerId: userId,
        status: 'COMPLETED',
      },
    });

    if (!purchase) {
      throw new BadRequestException('Вы не приобретали этот сценарий');
    }

    // Проверяем, что пользователь хотя бы раз запускал сценарий (как организатор)
    const run = await this.prisma.scenarioRun.findFirst({
      where: {
        organizerId: userId,
        scenarioId: listing.scenarioId,
        status: 'COMPLETED',
      },
    });

    if (!run) {
      throw new BadRequestException('Необходимо хотя бы раз запустить сценарий перед тем, как оставить отзыв');
    }

    // Проверяем, не оставлял ли пользователь уже отзыв
    const existing = await this.prisma.marketplaceReview.findUnique({
      where: { listingId_userId: { listingId, userId } },
    });

    if (existing) {
      throw new BadRequestException('Вы уже оставили отзыв на этот сценарий');
    }

    // Валидация рейтинга
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Рейтинг должен быть от 1 до 5');
    }

    const review = await this.prisma.marketplaceReview.create({
      data: {
        listingId,
        userId,
        rating,
        text,
        status: ReviewStatus.PENDING,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Обновляем средний рейтинг и количество отзывов в листинге
    await this.updateListingRating(listingId);

    this.logger.log(`Review created: ${review.id} for listing ${listingId} by user ${userId}`);

    return review;
  }

  /**
   * Обновить отзыв
   */
  async updateReview(reviewId: string, userId: string, rating: number, text?: string) {
    const review = await this.prisma.marketplaceReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Вы не можете редактировать чужой отзыв');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Нельзя редактировать отзыв после модерации');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Рейтинг должен быть от 1 до 5');
    }

    const updated = await this.prisma.marketplaceReview.update({
      where: { id: reviewId },
      data: { rating, text },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    await this.updateListingRating(review.listingId);

    return updated;
  }

  /**
   * Удалить отзыв
   */
  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.marketplaceReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Вы не можете удалить чужой отзыв');
    }

    await this.prisma.marketplaceReview.delete({
      where: { id: reviewId },
    });

    await this.updateListingRating(review.listingId);

    this.logger.log(`Review deleted: ${reviewId}`);
  }

  /**
   * Получить отзывы для листинга
   */
  async getListingReviews(listingId: string, status?: ReviewStatus, limit = 20, offset = 0) {
    const where: Record<string, unknown> = { listingId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.marketplaceReview.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.marketplaceReview.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Одобрить отзыв (модерация)
   */
  async approveReview(reviewId: string, moderatorId: string) {
    const review = await this.prisma.marketplaceReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Отзыв уже промодерирован');
    }

    const updated = await this.prisma.marketplaceReview.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.APPROVED,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });

    await this.updateListingRating(review.listingId);

    this.logger.log(`Review approved: ${reviewId} by moderator ${moderatorId}`);

    return updated;
  }

  /**
   * Отклонить отзыв (модерация)
   */
  async rejectReview(reviewId: string, moderatorId: string) {
    const review = await this.prisma.marketplaceReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Отзыв уже промодерирован');
    }

    const updated = await this.prisma.marketplaceReview.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.REJECTED,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });

    this.logger.log(`Review rejected: ${reviewId} by moderator ${moderatorId}`);

    return updated;
  }

  /**
   * Получить отзывы, ожидающие модерации
   */
  async getPendingReviews(limit = 20, offset = 0) {
    const where = { status: ReviewStatus.PENDING };

    const [items, total] = await Promise.all([
      this.prisma.marketplaceReview.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.marketplaceReview.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Обновить средний рейтинг и количество отзывов в листинге
   */
  private async updateListingRating(listingId: string) {
    const stats = await this.prisma.marketplaceReview.aggregate({
      where: {
        listingId,
        status: ReviewStatus.APPROVED,
      },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewsCount: stats._count,
      },
    });
  }
}