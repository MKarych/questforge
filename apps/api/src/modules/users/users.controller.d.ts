import { UsersService } from './users.service';
import { UserRequest } from '../../common/types/user-request.type';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    getMyProfile(req: UserRequest): Promise<{
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
    updateProfile(req: UserRequest, dto: any): Promise<{
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
    updateAvatar(req: UserRequest, body: {
        avatarUrl: string;
    }): Promise<{
        avatarUrl: string;
    }>;
    deleteAvatar(req: UserRequest): Promise<{
        avatarUrl: null;
    }>;
    deleteUser(req: UserRequest): Promise<{
        message: string;
    }>;
    getFollowers(userId: string, limit?: string, offset?: string): Promise<{
        items: any;
        total: any;
    }>;
    getFollowing(userId: string, limit?: string, offset?: string): Promise<{
        items: any;
        total: any;
    }>;
    followUser(req: UserRequest, followingId: string): Promise<{
        message: string;
    }>;
    unfollowUser(req: UserRequest, followingId: string): Promise<{
        message: string;
    }>;
    getFavorites(userId: string): Promise<any>;
    addFavorite(req: UserRequest, category: string, itemId: string): Promise<any>;
    removeFavorite(req: UserRequest, category: string, itemId: string): Promise<any>;
    getActivityFeed(userId: string, limit?: string, offset?: string): Promise<{
        items: any;
        total: any;
    }>;
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
    getUserScenarios(userId: string, limit?: string, offset?: string): Promise<{
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
    checkAchievements(req: UserRequest): Promise<import("../achievements/achievement.types").Achievement[]>;
    getUserReviews(userId: string, limit?: string, offset?: string): Promise<{
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
    recalculateTrustScore(req: UserRequest): Promise<number>;
    recalculateCapabilities(req: UserRequest): Promise<string[]>;
}
//# sourceMappingURL=users.controller.d.ts.map