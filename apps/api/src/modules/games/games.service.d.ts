import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
export declare class GamesService {
    private readonly prisma;
    private readonly logger;
    private readonly gameStateMachine;
    constructor(prisma: PrismaService);
    findAllPublic(params: {
        city?: string;
        dateFrom?: string;
        dateTo?: string;
        type?: string;
        sort?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            averageRating: number;
            reviewsCount: number;
            teamsCount: number;
            id: string;
            organizer: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            shareLink: string;
            title: string;
            description: string | null;
            city: string;
            date: Date;
            duration: number;
            price: import("@prisma/client/runtime/library").Decimal;
            maxTeams: number;
            status: import(".prisma/client").$Enums.GameStatus;
            imageUrl: string | null;
            publishedAt: Date | null;
            _count: {
                gameTeams: number;
                reviews: number;
            };
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    findOneByShareLink(shareLink: string): Promise<{
        averageRating: number;
        reviewsCount: number;
        teamsCount: number;
        commentsCount: number;
        scenario: {
            id: string;
            version: number;
            name: string;
            description: string | null;
        } | null;
        organizer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        comments: {
            text: string;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            id: string;
            createdAt: Date;
        }[];
        reviews: {
            text: string | null;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            id: string;
            createdAt: Date;
            rating: number;
        }[];
        _count: {
            comments: number;
            gameTeams: number;
            reviews: number;
        };
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
    findOnePublic(gameId: string): Promise<{
        averageRating: number;
        reviewsCount: number;
        teamsCount: number;
        commentsCount: number;
        scenario: {
            id: string;
            version: number;
            name: string;
            description: string | null;
        } | null;
        organizer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        comments: {
            text: string;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            id: string;
            createdAt: Date;
        }[];
        reviews: {
            text: string | null;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            id: string;
            createdAt: Date;
            rating: number;
        }[];
        _count: {
            comments: number;
            gameTeams: number;
            reviews: number;
        };
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
    findAll(params: {
        status?: string;
        city?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            averageRating: number;
            id: string;
            organizer: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            title: string;
            description: string | null;
            city: string;
            date: Date;
            duration: number;
            price: import("@prisma/client/runtime/library").Decimal;
            maxTeams: number;
            status: import(".prisma/client").$Enums.GameStatus;
            imageUrl: string | null;
            publishedAt: Date | null;
            _count: {
                gameTeams: number;
                reviews: number;
            };
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    findOne(gameId: string): Promise<{
        averageRating: number;
        shareLink: string;
        scenario: {
            id: string;
            version: number;
            name: string;
            description: string | null;
        } | null;
        organizer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        reviews: {
            text: string | null;
            user: {
                name: string;
                avatarUrl: string | null;
            };
            id: string;
            createdAt: Date;
            rating: number;
        }[];
        _count: {
            comments: number;
            gameTeams: number;
            reviews: number;
        };
        id: string;
        createdAt: Date;
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
    getReviews(gameId: string, params: {
        limit?: number;
        offset?: number;
    }): Promise<{
        data: ({
            user: {
                name: string;
                avatarUrl: string | null;
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
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    getTeams(gameId: string, params: {
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.TeamStatus;
            finishedAt: Date | null;
            penalties: number;
            score: number;
            captain: {
                name: string;
            };
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    create(userId: string, dto: CreateGameDto): Promise<{
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
    findAllForOrganizer(userId: string, params: {
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            id: string;
            shareLink: string;
            title: string;
            city: string;
            date: Date;
            status: import(".prisma/client").$Enums.GameStatus;
            moderationStatus: import(".prisma/client").$Enums.ModerationStatus;
            publishedAt: Date | null;
            _count: {
                gameTeams: number;
                reviews: number;
            };
        }[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    findOneForOrganizer(userId: string, gameId: string): Promise<{
        scenario: {
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
        } | null;
        reviews: {
            text: string | null;
            id: string;
            createdAt: Date;
            gameId: string;
            updatedAt: Date;
            rating: number;
            userId: string;
        }[];
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
    }>;
    update(userId: string, gameId: string, dto: Partial<CreateGameDto>): Promise<{
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
    remove(userId: string, gameId: string): Promise<{
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
    submitForModeration(userId: string, gameId: string): Promise<{
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
    startGame(userId: string, gameId: string): Promise<{
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
    finishGame(userId: string, gameId: string): Promise<{
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
    private generateShareLink;
    uploadCover(userId: string, gameId: string, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    private getExtension;
    publishGame(userId: string, gameId: string): Promise<{
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
    findPendingGames(params: {
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
    moderateGame(gameId: string, status: 'APPROVED' | 'REJECTED', comment: string | undefined, moderatorId: string): Promise<{
        organizer: {
            id: string;
            name: string;
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
    registerTeam(gameId: string, teamId: string, userId: string): Promise<{
        id: string;
        teamId: string;
        gameId: string;
        team: {
            id: string;
            name: string;
            captainId: string;
        };
        joinedAt: Date;
    }>;
}
//# sourceMappingURL=games.service.d.ts.map