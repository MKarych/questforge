// ============================================================
// User Domain Types — полная типизация по контракту
// ============================================================

import { Achievement } from '../../achievements/achievement.types';

// ============================================================
// IDENTITY (неизменяемая часть)
// ============================================================
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

// ============================================================
// PROFILE (изменяемая часть)
// ============================================================
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

// ============================================================
// SETTINGS
// ============================================================
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

// ============================================================
// SECURITY
// ============================================================
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

// ============================================================
// REPUTATION (вычисляется системой)
// ============================================================
export interface Reputation {
  rating: number;
  trustScore: number;
  reviewsCount: number;
  violations: number;
  completedGames: number;
  achievements: Achievement[];
}

// ============================================================
// AI PROFILE (принадлежит AI Service)
// ============================================================
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

// ============================================================
// CAPABILITIES (автоматически вычисляемые права)
// ============================================================
export enum Capability {
  HOST_EVENTS = 'HOST_EVENTS',
  CREATE_SCENARIOS = 'CREATE_SCENARIOS',
  SELL_SCENARIOS = 'SELL_SCENARIOS',
  CREATE_TEAM = 'CREATE_TEAM',
  STREAM_GAME = 'STREAM_GAME',
  MODERATE_CONTENT = 'MODERATE_CONTENT',
}

// ============================================================
// FEATURE FLAGS
// ============================================================
export interface FeatureFlags {
  aiBeta: boolean;
  marketplace: boolean;
  premium: boolean;
  experimentalUI: boolean;
}

// ============================================================
// METADATA (расширение без миграций)
// ============================================================
export interface UserMetadata {
  steamId?: string;
  discordGuildId?: string;
  betaTester?: boolean;
  migrationVersion?: number;
  [key: string]: unknown;
}

// ============================================================
// USER LIFECYCLE
// ============================================================
export enum UserLifecycleStage {
  REGISTERED = 'REGISTERED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  FIRST_GAME = 'FIRST_GAME',
  AUTHOR = 'AUTHOR',
  ORGANIZER = 'ORGANIZER',
  PREMIUM = 'PREMIUM',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}