import { PrismaService } from '../../common/prisma/prisma.service';
import { Achievement } from '../achievements/achievement.types';
/**
 * UsersService — Aggregate Root для User.
 * Все изменения пользователя проходят только через этот сервис.
 */
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    private readonly eventBus;
    constructor(prisma: PrismaService);
    getPublicProfile(userId: string): Promise<{
        uuid: any;
        username: any;
        slug: any;
        avatar: any;
        bio: any;
        city: any;
        rating: any;
        trustScore: any;
        achievements: any;
        gamesPlayed: number;
        gamesCreated: any;
        gamesConducted: any;
        scenariosCreated: any;
        reviewsCount: number;
        followersCount: number;
        followingCount: number;
        lastSeenAt: any;
        createdAt: any;
    }>;
    getMyProfile(userId: string): Promise<{
        uuid: any;
        username: any;
        slug: any;
        email: any;
        avatar: any;
        bio: any;
        city: any;
        roles: any;
        status: any;
        verified: any;
        version: any;
        rating: any;
        trustScore: any;
        achievements: any;
        gamesPlayed: number;
        gamesCreated: any;
        gamesConducted: any;
        scenariosCreated: any;
        reviewsCount: number;
        followersCount: number;
        followingCount: number;
        language: any;
        timezone: any;
        theme: any;
        notificationSettings: any;
        privacySettings: any;
        socialLinks: any;
        favorites: any;
        lastLoginAt: any;
        failedLoginAttempts: any;
        passwordChangedAt: any;
        trustedDevices: any;
        featureFlags: any;
        metadata: any;
        aiProfile: any;
        lastSeenAt: any;
        createdAt: any;
    }>;
    getAdminProfile(userId: string): Promise<{
        uuid: any;
        username: any;
        slug: any;
        email: any;
        avatar: any;
        bio: any;
        city: any;
        roles: any;
        status: any;
        verified: any;
        version: any;
        rating: any;
        trustScore: any;
        achievements: any;
        gamesPlayed: number;
        gamesCreated: any;
        gamesConducted: any;
        scenariosCreated: any;
        reviewsCount: number;
        followersCount: number;
        followingCount: number;
        language: any;
        timezone: any;
        theme: any;
        notificationSettings: any;
        privacySettings: any;
        socialLinks: any;
        favorites: any;
        lastLoginAt: any;
        failedLoginAttempts: any;
        passwordChangedAt: any;
        trustedDevices: any;
        capabilities: any;
        violations: any;
        featureFlags: any;
        metadata: any;
        deletedAt: any;
        lastSeenAt: any;
        createdAt: any;
        auditLog: {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            entity: string;
            entityId: string;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            userAgent: string | null;
        }[];
    }>;
    updateProfile(userId: string, dto: any, ip?: string, userAgent?: string): Promise<{
        uuid: any;
        username: any;
        slug: any;
        email: any;
        avatar: any;
        bio: any;
        city: any;
        roles: any;
        status: any;
        verified: any;
        version: any;
        rating: any;
        trustScore: any;
        achievements: any;
        gamesPlayed: number;
        gamesCreated: any;
        gamesConducted: any;
        scenariosCreated: any;
        reviewsCount: number;
        followersCount: number;
        followingCount: number;
        language: any;
        timezone: any;
        theme: any;
        notificationSettings: any;
        privacySettings: any;
        socialLinks: any;
        favorites: any;
        lastLoginAt: any;
        failedLoginAttempts: any;
        passwordChangedAt: any;
        trustedDevices: any;
        featureFlags: any;
        metadata: any;
        aiProfile: any;
        lastSeenAt: any;
        createdAt: any;
    }>;
    updateAvatar(userId: string, avatarUrl: string, ip?: string, userAgent?: string): Promise<{
        avatarUrl: string;
    }>;
    deleteAvatar(userId: string, ip?: string, userAgent?: string): Promise<{
        avatarUrl: null;
    }>;
    deleteUser(userId: string, ip?: string, userAgent?: string): Promise<{
        message: string;
    }>;
    followUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    unfollowUser(followerId: string, followingId: string): Promise<{
        message: string;
    }>;
    getFollowers(userId: string, limit?: number, offset?: number): Promise<{
        items: any;
        total: any;
    }>;
    getFollowing(userId: string, limit?: number, offset?: number): Promise<{
        items: any;
        total: any;
    }>;
    getFavorites(userId: string): Promise<any>;
    addFavorite(userId: string, category: 'games' | 'scenarios' | 'authors', itemId: string): Promise<any>;
    removeFavorite(userId: string, category: 'games' | 'scenarios' | 'authors', itemId: string): Promise<any>;
    getActivityFeed(userId: string, limit?: number, offset?: number): Promise<{
        items: any;
        total: any;
    }>;
    addActivity(userId: string, type: string, payload?: Record<string, unknown>): Promise<void>;
    getUserTeams(userId: string): Promise<({
        _count: {
            games: number;
            members: number;
        };
        captain: {
            id: string;
            username: string;
            slug: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        city: string | null;
        status: import(".prisma/client").$Enums.TeamStatus;
        finishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        penalties: number;
        score: number;
        slug: string;
        avatar: string | null;
        banner: string | null;
        country: string | null;
        website: string | null;
        socials: import("@prisma/client/runtime/library").JsonValue;
        captainId: string;
        privacy: import(".prisma/client").$Enums.TeamVisibility;
        joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
        tags: string[];
        maxMembers: number;
        maxInvitesPerDay: number;
        maxPendingRequests: number;
        maxChatMessagesPerMinute: number;
    })[]>;
    getUserScenarios(userId: string, limit?: number, offset?: number): Promise<{
        items: ({
            _count: {
                games: number;
                purchases: number;
            };
        } & {
            id: string;
            version: number;
            createdAt: Date;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            publishedAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
            authorId: string;
            isPublished: boolean;
            licenseType: string | null;
            nodes: import("@prisma/client/runtime/library").JsonValue;
            edges: import("@prisma/client/runtime/library").JsonValue;
            startNodeId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            validationStatus: string | null;
            validationErrors: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        total: number;
    }>;
    getUserAchievements(userId: string): Promise<any>;
    addAchievement(userId: string, achievement: Achievement): Promise<any>;
    checkAndAwardAchievements(userId: string): Promise<Achievement[]>;
    getUserReviews(userId: string, limit?: number, offset?: number): Promise<{
        items: ({
            game: {
                id: string;
                title: string;
                imageUrl: string | null;
            };
        } & {
            text: string | null;
            id: string;
            createdAt: Date;
            gameId: string;
            updatedAt: Date;
            rating: number;
            userId: string;
        })[];
        total: number;
    }>;
    recalculateTrustScore(userId: string): Promise<number>;
    recalculateCapabilities(userId: string): Promise<string[]>;
    updateLastSeen(userId: string): Promise<void>;
    calculateUserRating(userId: string): Promise<number>;
    private createAuditLog;
    private slugify;
}
//# sourceMappingURL=users.service.d.ts.map