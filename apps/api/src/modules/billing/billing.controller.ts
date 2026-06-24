import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * GET /billing/limits — получить лимиты текущего пользователя
   */
  @Get('limits')
  async getLimits(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.getUserLimits(userId);
  }

  /**
   * GET /billing/ai-check — проверка лимита AI-генераций
   */
  @Get('ai-check')
  async checkAiLimit(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.checkAiGenerationLimit(userId);
  }

  /**
   * POST /billing/ai-increment — увеличить счётчик AI-генераций
   */
  @Post('ai-increment')
  async incrementAi(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.incrementAiGenerations(userId);
  }

  /**
   * POST /billing/upgrade — обновить тариф (для тестов)
   */
  @Post('upgrade')
  async upgrade(
    @Request() req: any,
    @Body() body: { tier: 'FREE' | 'PRO' | 'BUSINESS' },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.upgradeUserTier(userId, body.tier);
  }

  /**
   * POST /billing/payment/create — создать тестовый платёж
   */
  @Post('payment/create')
  async createPayment(
    @Request() req: any,
    @Body() body: { tier: 'PRO' | 'BUSINESS' },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.createTestPayment(userId, body.tier);
  }

  /**
   * POST /billing/payment/confirm — подтвердить тестовый платёж
   */
  @Post('payment/confirm')
  async confirmPayment(
    @Request() req: any,
    @Body() body: { paymentId: string },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.confirmTestPayment(body.paymentId, userId);
  }

  /**
   * GET /billing/payments — история платежей
   */
  @Get('payments')
  async getPayments(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.billingService.getUserPayments(userId);
  }
}