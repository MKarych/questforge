import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ACHIEVEMENTS_LIST, ACHIEVEMENTS_MAP, AchievementType } from './achievement.types';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить все достижения (справочник)
   */
  getAllAchievements() {
    return ACHIEVEMENTS_LIST;
  }

  /**
   * Получить достижения пользователя
   */
  async getUserAchievements(userId: string) {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });

    // Добавляем locked достижения
    const unlockedTypes = new Set(userAchievements.map((a) => a.type));
    const allAchievements = ACHIEVEMENTS_LIST.map((ach) => {
      const unlocked = userAchievements.find((ua) => ua.type === ach.type);
      return {
        ...ach,
        id: unlocked?.id || null,
        unlockedAt: unlocked?.unlockedAt?.toISOString() || null,
        unlocked: !!unlocked,
      };
    });

    return allAchievements;
  }

  /**
   * Выдать достижение пользователю
   */
  async awardAchievement(userId: string, type: AchievementType) {
    const info = ACHIEVEMENTS_MAP[type];
    if (!info) {
      this.logger.warn(`Unknown achievement type: ${type}`);
      return null;
    }

    // Проверяем, не выдано ли уже
    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (existing) {
      return existing;
    }

    const achievement = await this.prisma.userAchievement.create({
      data: {
        userId,
        type,
        name: info.name,
        description: info.description,
        icon: info.icon,
      },
    });

    this.logger.log(`Achievement ${type} awarded to user ${userId}`);

    // Создаём уведомление
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: `🏆 Достижение: ${info.name}`,
          message: info.description,
          link: '/profile',
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to create notification for achievement: ${e}`);
    }

    // Создаём запись в ActivityLog
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          type: 'achievement',
          payload: { type, name: info.name, icon: info.icon },
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to create activity log for achievement: ${e}`);
    }

    return achievement;
  }

  /**
   * Проверить и выдать достижения по условиям
   */
  async checkAndAward(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            captainTeams: true,
            teamMemberships: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) return [];

    const existing = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((a) => a.type));

    const newAchievements: AchievementType[] = [];

    // FIRST_GAME — первая игра (есть команда)
    if (user._count.captainTeams >= 1 && !existingTypes.has('FIRST_GAME')) {
      newAchievements.push('FIRST_GAME');
    }

    // FIRST_WIN — первая победа (есть хотя бы одна завершённая игра)
    if (user._count.captainTeams >= 1 && !existingTypes.has('FIRST_WIN')) {
      newAchievements.push('FIRST_WIN');
    }

    // TEN_GAMES
    if (user._count.captainTeams >= 10 && !existingTypes.has('TEN_GAMES')) {
      newAchievements.push('TEN_GAMES');
    }

    // FIFTY_GAMES
    if (user._count.captainTeams >= 50 && !existingTypes.has('FIFTY_GAMES')) {
      newAchievements.push('FIFTY_GAMES');
    }

    // HUNDRED_GAMES
    if (user._count.captainTeams >= 100 && !existingTypes.has('HUNDRED_GAMES')) {
      newAchievements.push('HUNDRED_GAMES');
    }

    // FIRST_SCENARIO
    if (user.scenariosCreated >= 1 && !existingTypes.has('FIRST_SCENARIO')) {
      newAchievements.push('FIRST_SCENARIO');
    }

    // FIRST_REVIEW
    if (user._count.reviews >= 1 && !existingTypes.has('FIRST_REVIEW')) {
      newAchievements.push('FIRST_REVIEW');
    }

    // ORGANIZER
    if (user.role === 'ORGANIZER' && !existingTypes.has('ORGANIZER')) {
      newAchievements.push('ORGANIZER');
    }

    // AUTHOR — 5 сценариев
    if (user.scenariosCreated >= 5 && !existingTypes.has('AUTHOR')) {
      newAchievements.push('AUTHOR');
    }

    // TEAM_PLAYER — состоит в команде
    if (user._count.teamMemberships >= 1 && !existingTypes.has('TEAM_PLAYER')) {
      newAchievements.push('TEAM_PLAYER');
    }

    // LEADER — капитан команды
    if (user._count.captainTeams >= 1 && !existingTypes.has('LEADER')) {
      newAchievements.push('LEADER');
    }

    // Выдаём все новые достижения
    const awarded = [];
    for (const type of newAchievements) {
      const result = await this.awardAchievement(userId, type);
      if (result) awarded.push(result);
    }

    return awarded;
  }
}