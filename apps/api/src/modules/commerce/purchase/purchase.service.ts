import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LicenseEngineService } from '../license-engine/license-engine.service';
import { Prisma, PurchaseStatus, EarningStatus, LicenseType, ListingStatus } from '@prisma/client';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);
  private readonly COMMISSION_RATE = 0.3; // 30% комиссия платформы

  constructor(
    private readonly prisma: PrismaService,
    private readonly licenseEngine: LicenseEngineService,
  ) {}

  /**
   * Совершить покупку листинга
   */
  async purchase(
    listingId: string,
    buyerId: string,
    licenseType: LicenseType = LicenseType.SINGLE,
    promoCode?: string,
  ) {
    // Получаем листинг
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: {
        scenario: {
          select: {
            id: true,
            name: true,
            version: true,
            authorId: true,
          },
        },
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.status !== ListingStatus.PUBLISHED) {
      throw new BadRequestException('Листинг не опубликован');
    }

    // Проверяем, что покупатель не является автором
    if (listing.authorId === buyerId) {
      throw new BadRequestException('Нельзя купить собственный сценарий');
    }

    // Проверяем, нет ли уже активной лицензии
    const existingLicense = await this.prisma.userLicense.findFirst({
      where: {
        userId: buyerId,
        listingId,
        status: 'ACTIVE',
      },
    });

    if (existingLicense) {
      throw new BadRequestException('У вас уже есть активная лицензия на этот сценарий');
    }

    // Получаем последнюю опубликованную версию сценария
    const latestVersion = await this.prisma.scenarioVersion.findFirst({
      where: {
        scenarioId: listing.scenarioId,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      throw new BadRequestException('У сценария нет опубликованной версии');
    }

    // Конвертируем Decimal в number для расчётов
    const listingPrice = Number(listing.price);

    // Рассчитываем цену с учётом промокода
    let finalPrice = listingPrice;
    let appliedPromoCode: string | null = null;

    if (promoCode) {
      const discount = await this.validateAndApplyPromo(promoCode, listingId, finalPrice);
      if (discount) {
        finalPrice = discount.finalPrice;
        appliedPromoCode = promoCode;
      }
    }

    // Рассчитываем комиссию и роялти
    const commission = Math.round(finalPrice * this.COMMISSION_RATE * 100) / 100;
    const royalty = Math.round((finalPrice - commission) * 100) / 100;

    // Создаём Purchase, UserLicense и AuthorEarning в транзакции
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Создаём Purchase
      const purchase = await tx.purchase.create({
        data: {
          listingId,
          scenarioVersionId: latestVersion.id,
          buyerId,
          listingSnapshotTitle: listing.title,
          listingSnapshotVersion: String(listing.scenario.version),
          listingSnapshotPrice: listing.price,
          licenseType,
          price: finalPrice,
          commission,
          royalty,
          status: PurchaseStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 2. Создаём UserLicense
      const license = await tx.userLicense.create({
        data: {
          userId: buyerId,
          listingId,
          scenarioVersionId: latestVersion.id,
          licenseType,
          status: 'ACTIVE',
          activationsLimit: licenseType === LicenseType.SINGLE ? 1 : 0,
          updatePolicy: listing.updatePolicy,
        },
      });

      // 3. Создаём AuthorEarning
      const earning = await tx.authorEarning.create({
        data: {
          authorId: listing.authorId,
          purchaseId: purchase.id,
          amount: finalPrice,
          commission,
          royalty,
          status: EarningStatus.PENDING,
        },
      });

      // 4. Обновляем статистику листинга
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          sales: { increment: 1 },
        },
      });

      // 5. Инкрементируем использований промокода, если был применён
      if (appliedPromoCode) {
        await tx.promoCode.update({
          where: { code: appliedPromoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { purchase, license, earning };
    });

    this.logger.log(`Purchase completed: listing=${listingId}, buyer=${buyerId}, price=${finalPrice}`);

    return result;
  }

  /**
   * Получить покупки пользователя
   */
  async getUserPurchases(userId: string, limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where: { buyerId: userId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              category: true,
              licenseType: true,
            },
          },
          scenarioVersion: {
            select: {
              id: true,
              version: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.purchase.count({
        where: { buyerId: userId },
      }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Получить детали покупки
   */
  async getPurchaseById(purchaseId: string, userId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            category: true,
            authorId: true,
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        scenarioVersion: {
          select: {
            id: true,
            version: true,
            changelog: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Покупка не найдена');
    }

    if (purchase.buyerId !== userId) {
      throw new ForbiddenException('Это не ваша покупка');
    }

    return purchase;
  }

  /**
   * Запросить возврат (админский метод)
   */
  async refundPurchase(purchaseId: string, adminId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        earnings: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException('Покупка не найдена');
    }

    if (purchase.status !== PurchaseStatus.COMPLETED) {
      throw new BadRequestException('Покупка уже отменена или возвращена');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Обновляем статус покупки
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: PurchaseStatus.REFUNDED },
      });

      // Отзываем лицензию
      const license = await tx.userLicense.findFirst({
        where: {
          userId: purchase.buyerId,
          listingId: purchase.listingId,
          status: 'ACTIVE',
        },
      });

      if (license) {
        await tx.userLicense.update({
          where: { id: license.id },
          data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revokedReason: 'REFUND',
            revokedBy: adminId,
          },
        });
      }

      // Отменяем earnings
      for (const earning of purchase.earnings) {
        await tx.authorEarning.update({
          where: { id: earning.id },
          data: { status: EarningStatus.CANCELLED },
        });
      }

      // Уменьшаем счётчик продаж
      await tx.marketplaceListing.update({
        where: { id: purchase.listingId },
        data: { sales: { decrement: 1 } },
      });
    });

    this.logger.log(`Purchase refunded: id=${purchaseId}, admin=${adminId}`);
  }

  /**
   * Валидация и применение промокода
   */
  private async validateAndApplyPromo(
    code: string,
    listingId: string,
    amount: number,
  ): Promise<{ finalPrice: number; discountAmount: number } | null> {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) return null;
    if (promo.status !== 'ACTIVE') return null;
    if (promo.expiresAt && promo.expiresAt < new Date()) return null;
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return null;
    if (promo.listingId && promo.listingId !== listingId) return null;
    if (promo.minAmount && amount < Number(promo.minAmount)) return null;

    let discountAmount = 0;

    if (promo.type === 'PERCENTAGE') {
      discountAmount = Math.round(amount * (Number(promo.value) / 100) * 100) / 100;
    } else {
      discountAmount = Number(promo.value);
    }

    // Не превышаем maxAmount
    if (promo.maxAmount && discountAmount > Number(promo.maxAmount)) {
      discountAmount = Number(promo.maxAmount);
    }

    // Не уходим в минус
    const finalPrice = Math.max(0, amount - discountAmount);

    return { finalPrice, discountAmount };
  }
}