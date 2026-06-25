import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace/marketplace.service';
import { PurchaseService } from './purchase/purchase.service';
import { LicenseEngineService } from './license-engine/license-engine.service';
import { ReviewService } from './review/review.service';
import { CartService } from './cart/cart.service';
import { PromoService } from './promo/promo.service';
import { PayoutService } from './payout/payout.service';
import { AnalyticsService } from './analytics/analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    PurchaseService,
    LicenseEngineService,
    ReviewService,
    CartService,
    PromoService,
    PayoutService,
    AnalyticsService,
  ],
  exports: [
    LicenseEngineService,
    MarketplaceService,
    PurchaseService,
    ReviewService,
    CartService,
    PromoService,
    PayoutService,
    AnalyticsService,
  ],
})
export class CommerceModule {}