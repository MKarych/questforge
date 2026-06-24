import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
export declare class GamesController {
    private readonly gamesService;
    constructor(gamesService: GamesService);
    findAllPublic(city?: string, dateFrom?: string, dateTo?: string, type?: string, sort?: string, limit?: number, offset?: number): Promise<{
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
    findOnePublic(id: string): Promise<{
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
    findAll(status?: string, city?: string, limit?: number, offset?: number): Promise<{
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
    getReviews(gameId: string, limit?: number, offset?: number): Promise<{
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
    getTeams(gameId: string, limit?: number, offset?: number): Promise<{
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
    create(req: any, dto: CreateGameDto): Promise<{
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
    update(req: any, gameId: string, dto: Partial<CreateGameDto>): Promise<{
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
    remove(req: any, gameId: string): Promise<{
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
    submitForModeration(req: any, gameId: string): Promise<{
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
    startGame(req: any, gameId: string): Promise<{
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
    finishGame(req: any, gameId: string): Promise<{
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
    publishGame(req: any, gameId: string): Promise<{
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
    uploadCover(req: Request, gameId: string, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    findPendingGames(limit?: number, offset?: number): Promise<{
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
    moderateGame(gameId: string, body: {
        status: 'APPROVED' | 'REJECTED';
        comment?: string;
    }, req: any): Promise<{
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
    registerTeam(gameId: string, body: {
        teamId: string;
    }, req: any): Promise<{
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
//# sourceMappingURL=games.controller.d.ts.map