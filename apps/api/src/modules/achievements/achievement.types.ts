export type AchievementType = 
  | 'FIRST_SCENARIO'
  | 'ORGANIZER'
  | 'HUNDRED_GAMES'
  | 'FIRST_GAME'
  | 'TEN_GAMES'
  | 'FIFTY_GAMES'
  | 'TOP_RATED'
  | 'ACTIVE_PLAYER';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, 'id' | 'unlockedAt'>> = {
  FIRST_SCENARIO: {
    type: 'FIRST_SCENARIO',
    name: 'Первый сценарий',
    description: 'Опубликуйте свой первый сценарий',
    icon: '📝',
  },
  ORGANIZER: {
    type: 'ORGANIZER',
    name: 'Организатор',
    description: 'Получите роль организатора',
    icon: '🎯',
  },
  HUNDRED_GAMES: {
    type: 'HUNDRED_GAMES',
    name: '100 игр',
    description: 'Пройдите 100 игр',
    icon: '🏆',
  },
  FIRST_GAME: {
    type: 'FIRST_GAME',
    name: 'Первая игра',
    description: 'Пройдите свою первую игру',
    icon: '🎮',
  },
  TEN_GAMES: {
    type: 'TEN_GAMES',
    name: '10 игр',
    description: 'Пройдите 10 игр',
    icon: '🔟',
  },
  FIFTY_GAMES: {
    type: 'FIFTY_GAMES',
    name: '50 игр',
    description: 'Пройдите 50 игр',
    icon: '🎖️',
  },
  TOP_RATED: {
    type: 'TOP_RATED',
    name: 'Топ рейтинг',
    description: 'Достигните рейтинга 4.5+',
    icon: '⭐',
  },
  ACTIVE_PLAYER: {
    type: 'ACTIVE_PLAYER',
    name: 'Активный игрок',
    description: 'Играйте в течение 30 дней',
    icon: '🔥',
  },
};
