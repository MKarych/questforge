import { Achievement } from '../../achievements/achievement.types';
export interface Identity {
    uuid: string;
    username: string;
    slug: string;
    email: string;
    roles: string[];
    status: string;
    verified: {
        email: boolean;
        phone: boolean;
        telegram: boolean;
    };
    createdAt: Date;
    version: number;
}
export interface SocialLinks {
    tg?: string;
    vk?: string;
    discord?: string;
    youtube?: string;
    github?: string;
}
export interface Favorites {
    games: string[];
    scenarios: string[];
    authors: string[];
}
export interface Profile {
    avatar: string | null;
    bio: string;
    city: string;
    socialLinks: SocialLinks;
    favorites: Favorites;
    lastSeenAt: Date | null;
    metadata: Record<string, unknown>;
}
export interface NotificationSettings {
    email: boolean;
    telegram: boolean;
    push: boolean;
}
export interface PrivacySettings {
    showCity: 'everyone' | 'friends' | 'nobody';
    showContacts: 'everyone' | 'friends' | 'nobody';
    showStats: 'everyone' | 'friends' | 'nobody';
    showAchievements: 'everyone' | 'friends' | 'nobody';
}
export interface Settings {
    language: 'ru' | 'en';
    timezone: string;
    theme: 'dark' | 'light';
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}
export interface Device {
    id: string;
    name: string;
    lastIp: string;
    lastUsedAt: Date;
    trusted: boolean;
}
export interface Session {
    id: string;
    device: string;
    ip: string;
    createdAt: Date;
    lastActivity: Date;
}
export interface Security {
    passwordHash: string;
    lastLoginAt: Date | null;
    failedLoginAttempts: number;
    activeSessions: Session[];
    trustedDevices: Device[];
    passwordChangedAt: Date | null;
}
export interface Reputation {
    rating: number;
    trustScore: number;
    reviewsCount: number;
    violations: number;
    completedGames: number;
    achievements: Achievement[];
}
export interface AIPreferences {
    genres: string[];
    averageTeamSize: number;
    averageGameDuration: number;
    favoriteDifficulty: 'easy' | 'medium' | 'hard';
}
export interface AIMemory {
    knownFacts: string[];
    lastConversation: string;
    memoryVersion: number;
}
export interface AIHistory {
    recommendedScenarios: string[];
    previousActions: string[];
    feedback: string[];
}
export interface AIContext {
    lastAgentAction: string;
    activeGoals: string[];
    personality: string;
}
export interface AIProfile {
    preferences: AIPreferences;
    memory: AIMemory;
    history: AIHistory;
    context: AIContext;
    embeddings: number[];
}
export declare enum Capability {
    HOST_EVENTS = "HOST_EVENTS",
    CREATE_SCENARIOS = "CREATE_SCENARIOS",
    SELL_SCENARIOS = "SELL_SCENARIOS",
    CREATE_TEAM = "CREATE_TEAM",
    STREAM_GAME = "STREAM_GAME",
    MODERATE_CONTENT = "MODERATE_CONTENT"
}
export interface FeatureFlags {
    aiBeta: boolean;
    marketplace: boolean;
    premium: boolean;
    experimentalUI: boolean;
}
export interface UserMetadata {
    steamId?: string;
    discordGuildId?: string;
    betaTester?: boolean;
    migrationVersion?: number;
    [key: string]: unknown;
}
export declare enum UserLifecycleStage {
    REGISTERED = "REGISTERED",
    EMAIL_VERIFIED = "EMAIL_VERIFIED",
    FIRST_GAME = "FIRST_GAME",
    AUTHOR = "AUTHOR",
    ORGANIZER = "ORGANIZER",
    PREMIUM = "PREMIUM",
    INACTIVE = "INACTIVE",
    DELETED = "DELETED"
}
//# sourceMappingURL=user-types.d.ts.map