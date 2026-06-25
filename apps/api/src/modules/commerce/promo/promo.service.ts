import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PromoCodeType, PromoCodeStatus } from '@prisma/client';

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Валидировать промокод и вернуть скидку
   */
  async validatePromoCode(code: string, listingId: string, amount: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new NotFoundException('Промокод не найден');
    }

    if (promo.status !== PromoCodeStatus.ACTIVE) {
      throw new BadRequestException('Промокод неактивен');
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Срок действия промокода истёк');
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Лимит использований промокода исчерпан');
    }

    // Проверка на конкретный листинг
    if (promo.listingId && promo.listingId !== listingId) {
      throw new BadRequestException('Промокод не適用 для этого сценария');
    }

    // Проверка минимальной суммы
    if (promo.minAmount && amount < Number(promo.minAmount)) {
      throw new BadRequestException(
        `Минимальная сумма для промокода: ${promo.minAmount}`,
      );
    }

    // Расчёт скидки
    let discount = 0;
    if (promo.type === PromoCodeType.PERCENTAGE) {
      discount = amount * (Number(promo.value) / 100);
    } else {
      discount = Number(promo.value);
    }

    // Проверка максимальной скидки
    if (promo.maxAmount && discount > Number(promo.maxAmount)) {
      discount = Number(promo.maxAmount);
    }

    // Скидка не может быть больше суммы
    discount = Math.min(discount, amount);

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      discount,
      finalAmount: amount - discount,
    };
  }

  /**
   * Применить промокод (увеличить usedCount)
   */
  async applyPromoCode(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new NotFoundException('Промокод не найден');
    }

    await this.prisma.promoCode.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });

    this.logger.log(`Promo code applied: ${code}`);
  }

  /**
   * Создать промокод (админ)
   */
  async createPromoCode(data: {
    code: string;
    type: PromoCodeType;
    value: number;
    maxUses?: number;
    minAmount?: number;
    maxAmount?: number;
    listingId?: string;
    expiresAt?: Date;
    createdById: string;
  }) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException('Промокод с таким кодом уже существует');
    }

    const promo = await this.prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        maxUses: data.maxUses ?? 0,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        listingId: data.listingId ?? null,
        expiresAt: data.expiresAt ?? null,
        createdById: data.createdById,
      },
    });

    this.logger.log(`Promo code created: ${promo.code}`);

    return promo;
  }

  /**
   * Получить список промокодов (админ)
   */
  async getPromoCodes(limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        include: {
          createdBy: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.promoCode.count(),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Деактивировать промокод
   */
  async deactivatePromoCode(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new NotFoundException('Промокод не найден');
    }

    await this.prisma.promoCode.update({
      where: { code },
      data: { status: PromoCodeStatus.DISABLED },
    });

    this.logger.log(`Promo code deactivated: ${code}`);
  }
}