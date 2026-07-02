import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PurchaseService } from '../purchase/purchase.service';
import { LicenseType } from '@prisma/client';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly purchaseService: PurchaseService,
  ) {}

  /**
   * Получить корзину пользователя (создать если нет)
   */
  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                price: true,
                licenseType: true,
                status: true,
                scenario: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                author: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  licenseType: true,
                  status: true,
                  scenario: { select: { id: true, name: true } },
                  author: { select: { id: true, username: true } },
                },
              },
            },
          },
        },
      });
    }

    // Конвертируем Decimal в number
    const items = cart.items.map(item => ({
      ...item,
      listing: {
        ...item.listing,
        price: Number(item.listing.price),
      },
    }));

    const total = items.reduce((sum, item) => sum + item.listing.price, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      total,
      itemsCount: items.length,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Добавить товар в корзину
   */
  async addToCart(userId: string, listingId: string, licenseType: LicenseType = LicenseType.SINGLE) {
    // Проверяем листинг
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, deletedAt: true, authorId: true },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Листинг не опубликован');
    }

    if (listing.authorId === userId) {
      throw new BadRequestException('Нельзя добавить в корзину собственный сценарий');
    }

    // Получаем или создаём корзину
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    // Проверяем, не добавлен ли уже этот товар
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_listingId: { cartId: cart.id, listingId } },
    });

    if (existing) {
      throw new BadRequestException('Этот товар уже в корзине');
    }

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        listingId,
        licenseType,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            scenario: { select: { id: true, name: true } },
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    this.logger.log(`Item added to cart: ${item.id} for user ${userId}`);

    return {
      ...item,
      listing: {
        ...item.listing,
        price: Number(item.listing.price),
      },
    };
  }

  /**
   * Удалить товар из корзины
   */
  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Корзина не найдена');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Товар не найден в корзине');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    this.logger.log(`Item removed from cart: ${itemId} for user ${userId}`);
  }

  /**
   * Очистить корзину
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Корзина не найдена');
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    this.logger.log(`Cart cleared for user ${userId}`);
  }

  /**
   * Получить количество товаров в корзине
   */
  async getCartCount(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { _count: { select: { items: true } } },
    });

    return cart?._count.items ?? 0;
  }

  /**
   * Оформить заказ из корзины
   */
  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            listing: {
              select: {
                id: true,
                status: true,
                price: true,
                authorId: true,
                scenarioId: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

    const results: Array<{ listingId: string; success: boolean; error?: string }> = [];

    for (const item of cart.items) {
      try {
        await this.purchaseService.purchase(item.listingId, userId, item.licenseType);
        results.push({
          listingId: item.listingId,
          success: true,
        });
      } catch (error: any) {
        this.logger.error(`Checkout failed for listing ${item.listingId}: ${error.message}`);
        results.push({
          listingId: item.listingId,
          success: false,
          error: error.message,
        });
      }
    }

    // Очищаем корзину после checkout
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      this.logger.log(`Checkout completed for user ${userId}: ${cart.items.length} items`);
    } else {
      this.logger.warn(`Checkout partially completed for user ${userId}: ${results.filter(r => r.success).length}/${cart.items.length} succeeded`);
    }

    return {
      success: allSuccess,
      results,
      totalItems: cart.items.length,
    };
  }
}