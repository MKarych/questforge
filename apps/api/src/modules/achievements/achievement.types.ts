export type AchievementType =
  | 'FIRST_GAME'
  | 'FIRST_WIN'
  | 'TEN_GAMES'
  | 'FIFTY_GAMES'
  | 'FIRST_SCENARIO'
  | 'FIRST_REVIEW'
  | 'ORGANIZER'
  | 'AUTHOR'
  | 'EXPLORER'
  | 'DETECTIVE'
  | 'TEAM_PLAYER'
  | 'LEADER'
  | 'HUNDRED_GAMES'
  | 'TOP_RATED'
  | 'ACTIVE_PLAYER';

export interface AchievementInfo {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS_LIST: AchievementInfo[] = [
  { type: 'FIRST_GAME', name: 'Первая игра', description: 'Пройдите свою первую игру', icon: '🎮' },
  { type: 'FIRST_WIN', name: 'Первая победа', description: 'Одержите первую победу в игре', icon: '🥇' },
  { type: 'TEN_GAMES', name: '10 игр', description: 'Пройдите 10 игр', icon: '🔟' },
  { type: 'FIFTY_GAMES', name: '50 игр', description: 'Пройдите 50 игр', icon: '🎖️' },
  { type: 'FIRST_SCENARIO', name: 'Первый сценарий', description: 'Опубликуйте свой первый сценарий', icon: '📝' },
  { type: 'FIRST_REVIEW', name: 'Первый отзыв', description: 'Оставьте первый отзыв на игру', icon: '💬' },
  { type: 'ORGANIZER', name: 'Организатор', description: 'Получите роль организатора', icon: '🎯' },
  { type: 'AUTHOR', name: 'Автор', description: 'Создайте 5 сценариев', icon: '✍️' },
  { type: 'EXPLORER', name: 'Исследователь', description: 'Примите участие в играх в 3 разных городах', icon: '🧭' },
  { type: 'DETECTIVE', name: 'Мастер детектива', description: 'Пройдите 5 детективных сценариев', icon: '🔍' },
  { type: 'TEAM_PLAYER', name: 'Командный игрок', description: 'Состоите в команде более 30 дней', icon: '🤝' },
  { type: 'LEADER', name: 'Лидер', description: 'Станьте капитаном команды', icon: '👑' },
  { type: 'HUNDRED_GAMES', name: '100 игр', description: 'Пройдите 100 игр', icon: '🏆' },
  { type: 'TOP_RATED', name: 'Топ рейтинг', description: 'Достигните рейтинга 4.5+', icon: '⭐' },
  { type: 'ACTIVE_PLAYER', name: 'Активный игрок', description: 'Играйте в течение 30 дней подряд', icon: '🔥' },
];

export const ACHIEVEMENTS_MAP: Record<AchievementType, AchievementInfo> = Object.fromEntries(
  ACHIEVEMENTS_LIST.map((a) => [a.type, a]),
) as Record<AchievementType, AchievementInfo>;

// Обратная совместимость
export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}
