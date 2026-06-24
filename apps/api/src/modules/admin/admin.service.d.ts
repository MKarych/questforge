import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
        totalOrganizers: number;
        totalGames: number;
        activeGames: number;
        totalScenarios: number;
        pendingGames: number;
        pendingApplications: number;
    }>;
    getPendingGames(params: {
        limit: number;
        offset: number;
    }): Promise<{
        items: ({
            scenario: {
                id: string;
                name: string;
            } | null;
            organizer: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            _count: {
                gameTeams: number;
                reviews: number;
            };
        } & {
            id: string;
            createdAt: Date;
            shareLink: string;
            title: string;
            description: string | null;
            city: string;
            date: Date;
            duration: number;
            price: import("@prisma/client/runtime/library").Decimal;
            maxTeams: number;
            status: import(".prisma/client").$Enums.GameStatus;
            moderationStatus: import(".prisma/client").$Enums.ModerationStatus;
            moderationComment: string | null;
            organizerId: string;
            scenarioId: string | null;
            imageUrl: string | null;
            publishedAt: Date | null;
            submittedAt: Date | null;
            moderatedAt: Date | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
        })[];
        total: number;
    }>;
    approveGame(gameId: string, moderatorId: string): Promise<{
        organizer: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        shareLink: string;
        title: string;
        description: string | null;
        city: string;
        date: Date;
        duration: number;
        price: import("@prisma/client/runtime/library").Decimal;
        maxTeams: number;
        status: import(".prisma/client").$Enums.GameStatus;
        moderationStatus: import(".prisma/client").$Enums.ModerationStatus;
        moderationComment: string | null;
        organizerId: string;
        scenarioId: string | null;
        imageUrl: string | null;
        publishedAt: Date | null;
        submittedAt: Date | null;
        moderatedAt: Date | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    rejectGame(gameId: string, reason: string, moderatorId: string): Promise<{
        organizer: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        shareLink: string;
        title: string;
        description: string | null;
        city: string;
        date: Date;
        duration: number;
        price: import("@prisma/client/runtime/library").Decimal;
        maxTeams: number;
        status: import(".prisma/client").$Enums.GameStatus;
        moderationStatus: import(".prisma/client").$Enums.ModerationStatus;
        moderationComment: string | null;
        organizerId: string;
        scenarioId: string | null;
        imageUrl: string | null;
        publishedAt: Date | null;
        submittedAt: Date | null;
        moderatedAt: Date | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    getPendingApplications(): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            gamesCreated: number;
            scenariosCreated: number;
        };
    } & {
        id: string;
        createdAt: Date;
        city: string;
        status: string;
        updatedAt: Date;
        telegram: string | null;
        userId: string;
        phone: string;
        experience: string | null;
        rejectionReason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    })[]>;
    approveApplication(applicationId: string, moderatorId: string): Promise<{
        message: string;
        userId: string;
    }>;
    rejectApplication(applicationId: string, reason: string, moderatorId: string): Promise<{
        message: string;
        userId: string;
    }>;
    getUsers(params: {
        search?: string;
        limit: number;
        offset: number;
    }): Promise<{
        items: {
            role: import(".prisma/client").$Enums.Role;
            id: string;
            createdAt: Date;
            name: string;
            status: import(".prisma/client").$Enums.UserStatus;
            email: string;
            organizerStatus: import(".prisma/client").$Enums.OrganizerStatus;
            gamesCreated: number;
            scenariosCreated: number;
            lastLoginAt: Date | null;
            _count: {
                reviews: number;
                captainTeams: number;
            };
        }[];
        total: number;
    }>;
    blockUser(userId: string): Promise<{
        message: string;
    }>;
    unblockUser(userId: string): Promise<{
        message: string;
    }>;
    changeUserRole(userId: string, newRole: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=admin.service.d.ts.map