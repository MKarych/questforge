import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma, PayoutStatus, EarningStatus } from '@prisma/client';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить баланс автора (доступные для вывода средства)
   */
  async getBalance(authorId: string) {
    const earnings = await this.prisma.authorEarning.findMany({
      where: {
        authorId,
        status: { in: ['PENDING', 'AVAILABLE'] },
      },
    });

    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCommission = earnings.reduce((sum, e) => sum + Number(e.commission), 0);
    const totalRoyalty = earnings.reduce((sum, e) => sum + Number(e.royalty), 0);
    const availableForPayout = earnings
      .filter(e => e.status === 'AVAILABLE')
      .reduce((sum, e) => sum + Number(e.royalty), 0);

    return {
      totalEarnings,
      totalCommission,
      totalRoyalty,
      availableForPayout,
      pendingCount: earnings.filter(e => e.status === 'PENDING').length,
      availableCount: earnings.filter(e => e.status === 'AVAILABLE').length,
    };
  }

  /**
   * Запросить выплату
   */
  async requestPayout(authorId: string, amount: number) {
    // Проверяем баланс
    const balance = await this.getBalance(authorId);

    if (balance.availableForPayout < amount) {
      throw new BadRequestException(
        `Недостаточно средств. Доступно: ${balance.availableForPayout}, запрошено: ${amount}`,
      );
    }

    if (amount < 100) {
      throw new BadRequestException('Минимальная сумма выплаты — 100 ₽');
    }

    // Создаём выплату в транзакции
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Создаём Payout
      const payout = await tx.payout.create({
        data: {
          authorId,
          amount,
          status: PayoutStatus.PENDING,
        },
      });

      // 2. Находим AVAILABLE earnings и привязываем к выплате
      const availableEarnings = await tx.authorEarning.findMany({
        where: {
          authorId,
          status: 'AVAILABLE',
        },
        orderBy: { createdAt: 'asc' },
      });

      let remaining = amount;
      const linkedEarnings: string[] = [];

      for (const earning of availableEarnings) {
        if (remaining <= 0) break;

        const earningAmount = Number(earning.royalty);
        const toUse = Math.min(earningAmount, remaining);

        await tx.authorEarning.update({
          where: { id: earning.id },
          data: {
            status: EarningStatus.PAID_OUT,
            payoutId: payout.id,
          },
        });

        linkedEarnings.push(earning.id);
        remaining -= toUse;
      }

      return payout;
    });

    this.logger.log(`Payout requested: author=${authorId}, amount=${amount}`);

    return result;
  }

  /**
   * Получить историю выплат автора
   */
  async getPayoutHistory(authorId: string, limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { authorId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payout.count({ where: { authorId } }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Получить историю доходов автора
   */
  async getEarningsHistory(authorId: string, limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.authorEarning.findMany({
        where: { authorId },
        include: {
          purchase: {
            select: {
              id: true,
              listingSnapshotTitle: true,
              createdAt: true,
              buyer: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.authorEarning.count({ where: { authorId } }),
    ]);

    return { items, total, limit, offset };
  }

  /**
   * Обработать выплату (админ)
   */
  async processPayout(payoutId: string, adminId: string, paymentId?: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Выплата не найдена');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Выплата уже обработана');
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PAID,
        processedAt: new Date(),
        processedBy: adminId,
        paymentId: paymentId || null,
      },
    });

    this.logger.log(`Payout processed: id=${payoutId}, admin=${adminId}`);

    return updated;
  }

  /**
   * Отклонить выплату (админ)
   */
  async failPayout(payoutId: string, adminId: string, reason: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { earnings: true },
    });

    if (!payout) {
      throw new NotFoundException('Выплата не найдена');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Выплата уже обработана');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Отмечаем выплату как failed
      await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failedReason: reason,
          processedAt: new Date(),
          processedBy: adminId,
        },
      });

      // Возвращаем earnings в статус AVAILABLE
      for (const earning of payout.earnings) {
        await tx.authorEarning.update({
          where: { id: earning.id },
          data: {
            status: EarningStatus.AVAILABLE,
            payoutId: null,
          },
        });
      }
    });

    this.logger.log(`Payout failed: id=${payoutId}, reason=${reason}`);
  }

  /**
   * Получить все ожидающие выплаты (админ)
   */
  async getPendingPayouts(limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { status: PayoutStatus.PENDING },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payout.count({ where: { status: PayoutStatus.PENDING } }),
    ]);

    return { items, total, limit, offset };
  }
}