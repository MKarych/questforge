import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ListingStatus } from '@prisma/client';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Задать вопрос к листингу
   */
  async askQuestion(listingId: string, userId: string, question: string) {
    // Проверяем, что листинг существует и опубликован
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, authorId: true },
    });

    if (!listing) {
      throw new NotFoundException('Листинг не найден');
    }

    if (listing.status !== ListingStatus.PUBLISHED) {
      throw new BadRequestException('Нельзя задать вопрос к неопубликованному листингу');
    }

    // Нельзя задавать вопрос к своему листингу
    if (listing.authorId === userId) {
      throw new BadRequestException('Нельзя задать вопрос к своему листингу');
    }

    const created = await this.prisma.listingQuestion.create({
      data: {
        listingId,
        userId,
        question,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return created;
  }

  /**
   * Ответить на вопрос (только автор листинга)
   */
  async answerQuestion(questionId: string, sellerId: string, answer: string) {
    const question = await this.prisma.listingQuestion.findUnique({
      where: { id: questionId },
      include: {
        listing: {
          select: { authorId: true, title: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Вопрос не найден');
    }

    if (question.listing.authorId !== sellerId) {
      throw new ForbiddenException('Только автор листинга может ответить на вопрос');
    }

    if (question.answer) {
      throw new BadRequestException('На этот вопрос уже дан ответ');
    }

    const updated = await this.prisma.listingQuestion.update({
      where: { id: questionId },
      data: {
        answer,
        answeredAt: new Date(),
        answeredBy: sellerId,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return updated;
  }

  /**
   * Получить отвеченные вопросы для публичного показа
   */
  async getListingQuestions(listingId: string) {
    const questions = await this.prisma.listingQuestion.findMany({
      where: {
        listingId,
        answer: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return questions;
  }

  /**
   * Получить все вопросы к листингам продавца
   */
  async getSellerQuestions(sellerId: string) {
    const questions = await this.prisma.listingQuestion.findMany({
      where: {
        listing: {
          authorId: sellerId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return questions;
  }

  /**
   * Получить неотвеченные вопросы продавца
   */
  async getUnansweredQuestions(sellerId: string) {
    const questions = await this.prisma.listingQuestion.findMany({
      where: {
        listing: {
          authorId: sellerId,
        },
        answer: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return questions;
  }

  /**
   * Получить количество неотвеченных вопросов
   */
  async getUnansweredCount(sellerId: string): Promise<number> {
    const count = await this.prisma.listingQuestion.count({
      where: {
        listing: {
          authorId: sellerId,
        },
        answer: null,
      },
    });

    return count;
  }
}