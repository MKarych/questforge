import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AchievementType, Achievement } from '../achievements/achievement.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        bio: true,
        telegram: true,
        vk: true,
        whatsapp: true,
        role: true,
        rating: true,
        reputation: true,
        achievements: true,
        gamesCreated: true,
        gamesConducted: true,
        scenariosCreated: true,
        createdAt: true,
        lastSeenAt: true,
        _count: {
          select: {
            games: true,
            scenarios: true,
            captainTeams: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Calculate average rating from reviews
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      select: { rating: true },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...user,
      rating: Math.round(avgRating * 100) / 100,
      gamesPlayed: user._count.captainTeams,
      gamesCreated: user.gamesCreated,
      gamesConducted: user.gamesConducted,
      scenariosCreated: user.scenariosCreated,
      reviewsCount: user._count.reviews,
    };
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        city: true,
        bio: true,
        telegram: true,
        vk: true,
        whatsapp: true,
        role: true,
        rating: true,
        reputation: true,
        achievements: true,
        organizerStatus: true,
        gamesCreated: true,
        gamesConducted: true,
        scenariosCreated: true,
        createdAt: true,
        lastLoginAt: true,
        lastSeenAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        bio: true,
        telegram: true,
        vk: true,
        whatsapp: true,
        role: true,
        rating: true,
        reputation: true,
      },
    });

    this.logger.log(`Profile updated for user ${userId}`);
    return updatedUser;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    if (!avatarUrl || !avatarUrl.startsWith('http')) {
      throw new BadRequestException('Некорректный URL аватара');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
        name: true,
      },
    });

    this.logger.log(`Avatar updated for user ${userId}`);
    return user;
  }

  async addAchievement(userId: string, achievement: Achievement) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { achievements: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const achievements = (user.achievements as unknown as Achievement[]) || [];
    
    // Check if achievement already exists
    const alreadyUnlocked = achievements.some(a => a.type === achievement.type);
    if (alreadyUnlocked) {
      return achievements;
    }

    const updatedAchievements = [...achievements, achievement];

    await this.prisma.user.update({
      where: { id: userId },
      data: { achievements: updatedAchievements as unknown as any },
    });

    this.logger.log(`Achievement ${achievement.type} unlocked for user ${userId}`);
    return updatedAchievements;
  }

  async checkAndAwardAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        gamesCreated: true,
        gamesConducted: true,
        scenariosCreated: true,
        achievements: true,
        _count: {
          select: {
            captainTeams: true,
          },
        },
      },
    });

    if (!user) return;

    const achievements = (user.achievements as unknown as Achievement[]) || [];
    const newAchievements: Achievement[] = [];

    // Achievement: First Scenario
    if (user.scenariosCreated >= 1 && !achievements.some(a => a.type === 'FIRST_SCENARIO')) {
      newAchievements.push({
        id: `ach_first_scenario_${userId}`,
        type: 'FIRST_SCENARIO',
        name: 'Первый сценарий',
        description: 'Опубликуйте свой первый сценарий',
        icon: '📝',
        unlockedAt: new Date().toISOString(),
      });
    }

    // Achievement: Organizer
    if (user.role === 'ORGANIZER' && !achievements.some(a => a.type === 'ORGANIZER')) {
      newAchievements.push({
        id: `ach_organizer_${userId}`,
        type: 'ORGANIZER',
        name: 'Организатор',
        description: 'Получите роль организатора',
        icon: '🎯',
        unlockedAt: new Date().toISOString(),
      });
    }

    // Achievement: 100 Games
    if (user._count.captainTeams >= 100 && !achievements.some(a => a.type === 'HUNDRED_GAMES')) {
      newAchievements.push({
        id: `ach_100games_${userId}`,
        type: 'HUNDRED_GAMES',
        name: '100 игр',
        description: 'Пройдите 100 игр',
        icon: '🏆',
        unlockedAt: new Date().toISOString(),
      });
    }

    // Award new achievements
    for (const achievement of newAchievements) {
      await this.addAchievement(userId, achievement);
    }

    return newAchievements;
  }

  async updateLastSeen(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  async calculateUserRating(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return 0;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const roundedRating = Math.round(avgRating * 100) / 100;

    await this.prisma.user.update({
      where: { id: userId },
      data: { rating: roundedRating },
    });

    return roundedRating;
  }
}
