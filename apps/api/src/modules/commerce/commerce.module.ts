import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceController } from './marketplace.controller';
import { QuestionsController } from './questions/questions.controller';
import { MarketplaceService } from './marketplace/marketplace.service';
import { PurchaseService } from './purchase/purchase.service';
import { LicenseEngineService } from './license-engine/license-engine.service';
import { ReviewService } from './review/review.service';
import { CartService } from './cart/cart.service';
import { PromoService } from './promo/promo.service';
import { PayoutService } from './payout/payout.service';
import { AnalyticsService } from './analytics/analytics.service';
import { QuestionsService } from './questions/questions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MarketplaceController, QuestionsController],
  providers: [
    MarketplaceService,
    PurchaseService,
    LicenseEngineService,
    ReviewService,
    CartService,
    PromoService,
    PayoutService,
    AnalyticsService,
    QuestionsService,
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
    QuestionsService,
  ],
})
export class CommerceModule {}