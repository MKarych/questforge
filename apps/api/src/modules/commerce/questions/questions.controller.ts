import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { QuestionsService } from './questions.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string; roles: Role[] };
}

@Controller('marketplace')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // ============================================================
  // Публичные эндпоинты
  // ============================================================

  /**
   * GET /marketplace/:id/questions — отвеченные вопросы к листингу
   */
  @Get(':id/questions')
  async getListingQuestions(@Param('id') id: string) {
    return this.questionsService.getListingQuestions(id);
  }

  // ============================================================
  // Эндпоинты с аутентификацией
  // ============================================================

  /**
   * POST /marketplace/:id/questions — задать вопрос
   */
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/questions')
  async askQuestion(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('question') question: string,
  ) {
    if (!question || question.trim().length === 0) {
      return { error: { message: 'Вопрос не может быть пустым' } };
    }
    return this.questionsService.askQuestion(id, req.user.userId, question);
  }

  /**
   * PATCH /marketplace/questions/:id/answer — ответить на вопрос
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch('questions/:id/answer')
  async answerQuestion(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('answer') answer: string,
  ) {
    if (!answer || answer.trim().length === 0) {
      return { error: { message: 'Ответ не может быть пустым' } };
    }
    return this.questionsService.answerQuestion(id, req.user.userId, answer);
  }

  /**
   * GET /marketplace/seller/questions — все вопросы к моим листингам
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('seller/questions')
  async getSellerQuestions(@Req() req: AuthenticatedRequest) {
    return this.questionsService.getSellerQuestions(req.user.userId);
  }

  /**
   * GET /marketplace/seller/questions/unanswered — неотвеченные вопросы
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('seller/questions/unanswered')
  async getUnansweredQuestions(@Req() req: AuthenticatedRequest) {
    return this.questionsService.getUnansweredQuestions(req.user.userId);
  }

  /**
   * GET /marketplace/seller/questions/unanswered/count — количество неотвеченных
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('seller/questions/unanswered/count')
  async getUnansweredCount(@Req() req: AuthenticatedRequest) {
    const count = await this.questionsService.getUnansweredCount(req.user.userId);
    return { count };
  }
}