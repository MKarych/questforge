import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export const TIER_LIMITS: Record<string, {
  aiGenerationsLimit: number;
  gamesLimit: number;
  teamsLimit: number;
  analyticsLevel: string;
  marketplaceAccess: boolean;
  exportEnabled: boolean;
}> = {
  FREE: {
    aiGenerationsLimit: 3,
    gamesLimit: 1,
    teamsLimit: 10,
    analyticsLevel: 'basic',
    marketplaceAccess: false,
    exportEnabled: false,
  },
  PRO: {
    aiGenerationsLimit: 50,
    gamesLimit: 10,
    teamsLimit: 50,
    analyticsLevel: 'advanced',
    marketplaceAccess: true,
    exportEnabled: true,
  },
  BUSINESS: {
    aiGenerationsLimit: 500,
    gamesLimit: 100,
    teamsLimit: 500,
    analyticsLevel: 'full',
    marketplaceAccess: true,
    exportEnabled: true,
  },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить лимиты пользователя.
   * Если UserLimits не существует — создаётся с тарифом FREE.
   */
  async getUserLimits(userId: string) {
    let limits = await this.prisma.userLimits.findUnique({
      where: { userId },
    });

    if (!limits) {
      limits = await this.prisma.userLimits.create({
        data: {
          userId,
          tier: 'FREE',
          aiGenerationsToday: 0,
          aiGenerationsLimit: TIER_LIMITS.FREE.aiGenerationsLimit,
          gamesLimit: TIER_LIMITS.FREE.gamesLimit,
          teamsLimit: TIER_LIMITS.FREE.teamsLimit,
          analyticsLevel: TIER_LIMITS.FREE.analyticsLevel,
          marketplaceAccess: TIER_LIMITS.FREE.marketplaceAccess,
          exportEnabled: TIER_LIMITS.FREE.exportEnabled,
        },
      });
    }

    // Сброс aiGenerationsToday если новый день
    const today = new Date().toISOString().slice(0, 10);
    if (limits.aiGenerationsResetAt) {
      const resetDay = limits.aiGenerationsResetAt.toISOString().slice(0, 10);
      if (resetDay !== today) {
        limits = await this.prisma.userLimits.update({
          where: { userId },
          data: {
            aiGenerationsToday: 0,
            aiGenerationsResetAt: new Date(),
          },
        });
      }
    } else {
      limits = await this.prisma.userLimits.update({
        where: { userId },
        data: {
          aiGenerationsToday: 0,
          aiGenerationsResetAt: new Date(),
        },
      });
    }

    return limits;
  }

  /**
   * Обновить тариф пользователя (после оплаты).
   */
  async upgradeUserTier(userId: string, tier: 'FREE' | 'PRO' | 'BUSINESS') {
    const tierConfig = TIER_LIMITS[tier];
    if (!tierConfig) {
      throw new NotFoundException(`Тариф ${tier} не найден`);
    }

    // Рассчитываем expiresAt (30 дней для PRO/BUSINESS)
    let expiresAt: Date | null = null;
    if (tier !== 'FREE') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const limits = await this.prisma.userLimits.upsert({
      where: { userId },
      update: {
        tier,
        aiGenerationsLimit: tierConfig.aiGenerationsLimit,
        aiGenerationsToday: 0,
        aiGenerationsResetAt: new Date(),
        gamesLimit: tierConfig.gamesLimit,
        teamsLimit: tierConfig.teamsLimit,
        analyticsLevel: tierConfig.analyticsLevel,
        marketplaceAccess: tierConfig.marketplaceAccess,
        exportEnabled: tierConfig.exportEnabled,
        expiresAt,
      },
      create: {
        userId,
        tier,
        aiGenerationsToday: 0,
        aiGenerationsLimit: tierConfig.aiGenerationsLimit,
        aiGenerationsResetAt: new Date(),
        gamesLimit: tierConfig.gamesLimit,
        teamsLimit: tierConfig.teamsLimit,
        analyticsLevel: tierConfig.analyticsLevel,
        marketplaceAccess: tierConfig.marketplaceAccess,
        exportEnabled: tierConfig.exportEnabled,
        expiresAt,
      },
    });

    this.logger.log(`User ${userId} upgraded to ${tier}`);
    return limits;
  }

  /**
   * Проверить, может ли пользователь использовать AI-генерацию.
   * Возвращает { allowed, remaining, limit, error? }
   */
  async checkAiGenerationLimit(userId: string) {
    const limits = await this.getUserLimits(userId);

    const remaining = Math.max(0, limits.aiGenerationsLimit - limits.aiGenerationsToday);

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: limits.aiGenerationsLimit,
        tier: limits.tier,
        error: `❌ Лимит генераций исчерпан (${limits.aiGenerationsLimit}/день). Купите PRO для большего количества.`,
      };
    }

    return {
      allowed: true,
      remaining,
      limit: limits.aiGenerationsLimit,
      tier: limits.tier,
    };
  }

  /**
   * Увеличить счётчик AI-генераций.
   */
  async incrementAiGenerations(userId: string) {
    return this.prisma.userLimits.update({
      where: { userId },
      data: {
        aiGenerationsToday: { increment: 1 },
      },
    });
  }

  /**
   * Создать тестовый платёж (имитация).
   */
  async createTestPayment(userId: string, tier: 'PRO' | 'BUSINESS') {
    const prices: Record<string, number> = {
      PRO: 990,
      BUSINESS: 2990,
    };

    const amount = prices[tier];
    if (!amount) {
      throw new NotFoundException(`Цена для тарифа ${tier} не найдена`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        tier,
        amount,
        currency: 'RUB',
        status: 'pending',
        provider: 'test',
      },
    });

    this.logger.log(`Test payment created: ${payment.id} for user ${userId}, tier ${tier}`);

    return payment;
  }

  /**
   * Подтвердить тестовый платёж (имитация успеха через 2 сек).
   */
  async confirmTestPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException('Платёж не найден');
    }

    if (payment.status !== 'pending') {
      return { message: 'Платёж уже обработан', payment };
    }

    // Подтверждаем платёж
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Обновляем тариф пользователя
    await this.upgradeUserTier(userId, payment.tier as 'PRO' | 'BUSINESS');

    // Создаём запись в Ledger
    await this.prisma.ledgerEntry.create({
      data: {
        userId,
        type: 'payment',
        amount: payment.amount,
        currency: payment.currency,
        relatedId: paymentId,
        metadata: { tier: payment.tier },
      },
    });

    this.logger.log(`Test payment confirmed: ${paymentId} for user ${userId}`);

    return {
      message: '✅ Оплата успешно проведена!',
      payment: updatedPayment,
    };
  }

  /**
   * Получить историю платежей пользователя.
   */
  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}