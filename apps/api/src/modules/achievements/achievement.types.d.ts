export type AchievementType = 'FIRST_SCENARIO' | 'ORGANIZER' | 'HUNDRED_GAMES' | 'FIRST_GAME' | 'TEN_GAMES' | 'FIFTY_GAMES' | 'TOP_RATED' | 'ACTIVE_PLAYER';
export interface Achievement {
    id: string;
    type: AchievementType;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
}
export declare const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, 'id' | 'unlockedAt'>>;
//# sourceMappingURL=achievement.types.d.ts.map