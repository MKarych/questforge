import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { MarketplaceService } from './marketplace/marketplace.service';
import { PurchaseService } from './purchase/purchase.service';
import { LicenseEngineService } from './license-engine/license-engine.service';
import { ReviewService } from './review/review.service';
import { CartService } from './cart/cart.service';
import { PromoService } from './promo/promo.service';
import { PayoutService } from './payout/payout.service';
import { AnalyticsService } from './analytics/analytics.service';
import {
  MarketplaceQueryDto,
  CreateListingDto,
  UpdateListingDto,
  PurchaseDto,
  CreateReviewDto,
  AddToCartDto,
  ValidatePromoDto,
  RequestPayoutDto,
  ModerateListingDto,
  ModerateReviewDto,
} from './dto/marketplace.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; roles: Role[] };
}

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly purchaseService: PurchaseService,
    private readonly licenseEngine: LicenseEngineService,
    private readonly reviewService: ReviewService,
    private readonly cartService: CartService,
    private readonly promoService: PromoService,
    private readonly payoutService: PayoutService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ============================================================
  // Публичные эндпоинты
  // ============================================================

  @Get()
  async search(@Query() query: MarketplaceQueryDto) {
    return this.marketplaceService.search(query);
  }

  @Get('categories')
  async getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Get('types')
  async getLicenseTypes() {
    return this.marketplaceService.getLicenseTypes();
  }

  @Get('by-scenario/:scenarioId')
  async getByScenarioId(@Param('scenarioId') scenarioId: string) {
    return this.marketplaceService.getListingByScenarioId(scenarioId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.marketplaceService.getById(id);
  }

  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  async incrementViews(@Param('id') id: string) {
    await this.marketplaceService.incrementViews(id);
    return { success: true };
  }

  @Get(':id/reviews')
  async getListingReviews(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewService.getListingReviews(
      id,
      status as any,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============================================================
  // Авторские эндпоинты (требуют аутентификации)
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createListing(@Req() req: AuthenticatedRequest, @Body() dto: CreateListingDto) {
    return this.marketplaceService.create(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.marketplaceService.update(id, req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/publish')
  async publishListing(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.publish(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/unpublish')
  async unpublishListing(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.unpublish(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/listings')
  async getMyListings(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getAuthorListings(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/sales')
  async getMySales(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getAuthorSales(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/earnings')
  async getMyEarnings(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getAuthorEarnings(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/analytics')
  async getMyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.analyticsService.getAuthorAnalytics(
      req.user.userId,
      period as any,
      limit ? parseInt(limit, 10) : 30,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/analytics/summary')
  async getMyAnalyticsSummary(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getAuthorAnalyticsSummary(req.user.userId);
  }

  // ============================================================
  // Покупательские эндпоинты
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/purchase')
  async purchase(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: PurchaseDto,
  ) {
    return this.purchaseService.purchase(req.user.userId, id, dto.licenseType, dto.promoCode);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/favorite')
  async addFavorite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.addFavorite(req.user.userId, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/favorite')
  async removeFavorite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.removeFavorite(req.user.userId, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/purchases')
  async getMyPurchases(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.purchaseService.getUserPurchases(
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/licenses')
  async getMyLicenses(@Req() req: AuthenticatedRequest) {
    return this.licenseEngine.getUserLicenses(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/favorites')
  async getMyFavorites(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getUserFavorites(req.user.userId);
  }

  // ============================================================
  // Корзина
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Get('cart')
  async getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cart')
  async addToCart(@Req() req: AuthenticatedRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, dto.listingId, dto.licenseType);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('cart/:itemId')
  async removeFromCart(@Req() req: AuthenticatedRequest, @Param('itemId') itemId: string) {
    await this.cartService.removeFromCart(req.user.userId, itemId);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cart/clear')
  @HttpCode(HttpStatus.OK)
  async clearCart(@Req() req: AuthenticatedRequest) {
    await this.cartService.clearCart(req.user.userId);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cart/count')
  async getCartCount(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCartCount(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('cart/checkout')
  async checkout(@Req() req: AuthenticatedRequest) {
    return this.cartService.checkout(req.user.userId);
  }

  // ============================================================
  // Промокоды
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Post('promo/validate')
  async validatePromo(@Req() req: AuthenticatedRequest, @Body() dto: ValidatePromoDto) {
    return this.promoService.validatePromoCode(dto.code, dto.listingId, dto.amount);
  }

  // ============================================================
  // Отзывы
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/review')
  async createReview(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(id, req.user.userId, dto.rating, dto.text);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('reviews/:reviewId')
  async updateReview(
    @Req() req: AuthenticatedRequest,
    @Param('reviewId') reviewId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.updateReview(reviewId, req.user.userId, dto.rating, dto.text);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('reviews/:reviewId')
  async deleteReview(
    @Req() req: AuthenticatedRequest,
    @Param('reviewId') reviewId: string,
  ) {
    await this.reviewService.deleteReview(reviewId, req.user.userId);
    return { success: true };
  }

  // ============================================================
  // Выплаты
  // ============================================================

  @UseGuards(AuthGuard('jwt'))
  @Get('me/balance')
  async getMyBalance(@Req() req: AuthenticatedRequest) {
    return this.payoutService.getBalance(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/payouts')
  async requestPayout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestPayoutDto,
  ) {
    return this.payoutService.requestPayout(req.user.userId, dto.amount);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/payouts')
  async getMyPayouts(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.payoutService.getPayoutHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/earnings-history')
  async getMyEarningsHistory(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.payoutService.getEarningsHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============================================================
  // Админские эндпоинты
  // ============================================================

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/pending')
  async getPendingModeration() {
    return this.marketplaceService.getPendingModeration();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id/moderate')
  async moderateListing(
    @Param('id') id: string,
    @Body() dto: ModerateListingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.moderate(id, dto.status as any, dto.comment, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/reviews/pending')
  async getPendingReviews(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewService.getPendingReviews(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/reviews/:id/approve')
  async approveReview(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewService.approveReview(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/reviews/:id/reject')
  async rejectReview(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewService.rejectReview(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/payouts/pending')
  async getPendingPayouts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.payoutService.getPendingPayouts(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/payouts/:id/process')
  async processPayout(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.payoutService.processPayout(id, req.user.userId, paymentId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/payouts/:id/fail')
  async failPayout(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body('reason') reason: string,
  ) {
    return this.payoutService.failPayout(id, req.user.userId, reason);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/purchases/:id/refund')
  async refundPurchase(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.purchaseService.refundPurchase(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/promo')
  async createPromoCode(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.promoService.createPromoCode({ ...dto, createdById: req.user.userId });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/promo')
  async getPromoCodes(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.promoService.getPromoCodes(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/promo/:code/deactivate')
  async deactivatePromoCode(@Param('code') code: string) {
    return this.promoService.deactivatePromoCode(code);
  }
}