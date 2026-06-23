// ============================================================
// PublicUser DTO — то, что видят все
// ============================================================
export interface PublicUserDto {
  uuid: string;
  username: string;
  slug: string;
  avatar: string | null;
  bio: string;
  city: string;
  rating: number;
  trustScore: number;
  achievements: unknown[];
  gamesPlayed: number;
  gamesCreated: number;
  gamesConducted: number;
  scenariosCreated: number;
  reviewsCount: number;
  lastSeenAt: Date | null;
  createdAt: Date;
}

// ============================================================
// PrivateUser DTO — видит только владелец
// ============================================================
export interface PrivateUserDto extends PublicUserDto {
  email: string;
  roles: string[];
  status: string;
  verified: Record<string, boolean>;
  version: number;
  language: string;
  timezone: string;
  theme: string;
  notificationSettings: Record<string, unknown>;
  privacySettings: Record<string, unknown>;
  socialLinks: Record<string, string>;
  favorites: Record<string, string[]>;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  passwordChangedAt: Date | null;
  trustedDevices: unknown[];
  featureFlags: Record<string, boolean>;
  metadata: Record<string, unknown>;
  aiProfile: Record<string, unknown>;
}

// ============================================================
// AdminUser DTO — видит администратор
// ============================================================
export interface AdminUserDto extends PrivateUserDto {
  capabilities: string[];
  violations: number;
  deletedAt: Date | null;
  auditLog: unknown[];
}

// ============================================================
// Update Profile DTO
// ============================================================
export interface UpdateProfileDto {
  username?: string;
  bio?: string;
  city?: string;
  socialLinks?: {
    tg?: string;
    vk?: string;
    discord?: string;
    youtube?: string;
    github?: string;
  };
  language?: 'ru' | 'en';
  timezone?: string;
  theme?: 'dark' | 'light';
  notificationSettings?: {
    email?: boolean;
    telegram?: boolean;
    push?: boolean;
  };
  privacySettings?: {
    showCity?: 'everyone' | 'friends' | 'nobody';
    showContacts?: 'everyone' | 'friends' | 'nobody';
    showStats?: 'everyone' | 'friends' | 'nobody';
    showAchievements?: 'everyone' | 'friends' | 'nobody';
  };
  metadata?: Record<string, unknown>;
}

// ============================================================
// Update Avatar DTO
// ============================================================
export interface UpdateAvatarDto {
  avatarUrl: string;
}

// ============================================================
// Follow DTO
// ============================================================
export interface FollowUserDto {
  userId: string;
  username: string;
  slug: string;
  avatar: string | null;
  bio: string;
  followedAt: Date;
}

// ============================================================
// Activity Feed DTO
// ============================================================
export interface ActivityFeedDto {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================
// User Stats DTO
// ============================================================
export interface UserStatsDto {
  rating: number;
  trustScore: number;
  reviewsCount: number;
  violations: number;
  completedGames: number;
  gamesPlayed: number;
  gamesCreated: number;
  gamesConducted: number;
  scenariosCreated: number;
  achievements: unknown[];
}