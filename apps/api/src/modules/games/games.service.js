"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GamesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const state_machine_1 = require("../../engine/state-machine/state-machine");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let GamesService = GamesService_1 = class GamesService {
    prisma;
    logger = new common_1.Logger(GamesService_1.name);
    gameStateMachine = new state_machine_1.GameStateMachine();
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ============================================================
    // Public methods
    // ============================================================
    async findAllPublic(params) {
        const where = {
            moderationStatus: 'APPROVED', // Only show approved games
            deletedAt: null,
        };
        if (params.city) {
            where.city = params.city;
        }
        if (params.dateFrom) {
            where.date = { gte: new Date(params.dateFrom) };
        }
        if (params.dateTo) {
            where.date = {
                ...where.date,
                lte: new Date(params.dateTo)
            };
        }
        const [games, total] = await Promise.all([
            this.prisma.game.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { date: 'asc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    city: true,
                    date: true,
                    duration: true,
                    price: true,
                    maxTeams: true,
                    shareLink: true,
                    imageUrl: true,
                    status: true,
                    publishedAt: true,
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            gameTeams: true,
                            reviews: true,
                        },
                    },
                },
            }),
            this.prisma.game.count({ where }),
        ]);
        return {
            data: games.map((g) => ({
                ...g,
                averageRating: g._count.reviews > 0
                    ? g._count.reviews // Placeholder — would need a separate query for actual avg
                    : 0,
                reviewsCount: g._count.reviews,
                teamsCount: g._count.gameTeams,
            })),
            meta: {
                total,
                limit: params.limit || 20,
                offset: params.offset || 0,
            },
        };
    }
    async findOneByShareLink(shareLink) {
        const game = await this.prisma.game.findUnique({
            where: { shareLink, deletedAt: null },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        version: true,
                    },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rating: true,
                        text: true,
                        createdAt: true,
                        user: {
                            select: { name: true, avatarUrl: true },
                        },
                    },
                },
                comments: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        text: true,
                        createdAt: true,
                        user: {
                            select: { name: true, avatarUrl: true },
                        },
                    },
                },
                _count: {
                    select: {
                        gameTeams: true,
                        reviews: true,
                        comments: true,
                    },
                },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        // Calculate average rating
        const reviews = game.reviews || [];
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        const count = game._count || { gameTeams: 0, reviews: 0, comments: 0 };
        return {
            ...game,
            averageRating: Math.round(avgRating * 100) / 100,
            reviewsCount: count.reviews,
            teamsCount: count.gameTeams,
            commentsCount: count.comments,
        };
    }
    async findOnePublic(gameId) {
        // Validate UUID format to prevent Prisma errors
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(gameId)) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        const game = await this.prisma.game.findUnique({
            where: { id: gameId, deletedAt: null },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        version: true,
                    },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rating: true,
                        text: true,
                        createdAt: true,
                        user: {
                            select: { name: true, avatarUrl: true },
                        },
                    },
                },
                comments: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        text: true,
                        createdAt: true,
                        user: {
                            select: { name: true, avatarUrl: true },
                        },
                    },
                },
                _count: {
                    select: {
                        gameTeams: true,
                        reviews: true,
                        comments: true,
                    },
                },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        // Calculate average rating
        const avgRating = game.reviews?.length > 0
            ? game.reviews.reduce((sum, r) => sum + r.rating, 0) / game.reviews.length
            : 0;
        const count = game._count || { gameTeams: 0, reviews: 0, comments: 0 };
        return {
            ...game,
            averageRating: Math.round(avgRating * 100) / 100,
            reviewsCount: count.reviews,
            teamsCount: count.gameTeams,
            commentsCount: count.comments,
        };
    }
    async findAll(params) {
        const where = {
            publishedAt: { not: null }, // Only show published games
            deletedAt: null,
        };
        if (params.status) {
            where.status = params.status;
        }
        if (params.city) {
            where.city = params.city;
        }
        const [games, total] = await Promise.all([
            this.prisma.game.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { date: 'asc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    city: true,
                    date: true,
                    duration: true,
                    price: true,
                    maxTeams: true,
                    imageUrl: true,
                    status: true,
                    publishedAt: true,
                    organizer: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            gameTeams: true,
                            reviews: true,
                        },
                    },
                },
            }),
            this.prisma.game.count({ where }),
        ]);
        return {
            data: games.map((g) => ({
                ...g,
                averageRating: g._count.reviews > 0
                    ? g._count.reviews // Placeholder — would need a separate query for actual avg
                    : 0,
            })),
            meta: {
                total,
                limit: params.limit || 20,
                offset: params.offset || 0,
            },
        };
    }
    async findOne(gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId, deletedAt: null },
            include: {
                organizer: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                scenario: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        version: true,
                    },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rating: true,
                        text: true,
                        createdAt: true,
                        user: {
                            select: { name: true, avatarUrl: true },
                        },
                    },
                },
                _count: {
                    select: {
                        gameTeams: true,
                        reviews: true,
                        comments: true,
                    },
                },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        // Calculate average rating
        const avgRating = game.reviews?.length > 0
            ? game.reviews.reduce((sum, r) => sum + r.rating, 0) / game.reviews.length
            : 0;
        return {
            ...game,
            averageRating: Math.round(avgRating * 100) / 100,
            shareLink: game.shareLink,
        };
    }
    async getReviews(gameId, params) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { gameId },
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, avatarUrl: true } },
                },
            }),
            this.prisma.review.count({ where: { gameId } }),
        ]);
        return {
            data: reviews,
            meta: { total, limit: params.limit || 10, offset: params.offset || 0 },
        };
    }
    async getTeams(gameId, params) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        // Получаем команды через связь GameTeam
        const gameTeams = await this.prisma.gameTeam.findMany({
            where: { gameId },
            select: {
                teamId: true,
            },
        });
        const teamIds = gameTeams.map(gt => gt.teamId);
        if (teamIds.length === 0) {
            return {
                data: [],
                meta: { total: 0, limit: params.limit || 20, offset: params.offset || 0 },
            };
        }
        const [teams, total] = await Promise.all([
            this.prisma.team.findMany({
                where: {
                    id: { in: teamIds },
                },
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { score: 'desc' },
                select: {
                    id: true,
                    name: true,
                    score: true,
                    penalties: true,
                    status: true,
                    finishedAt: true,
                    captain: { select: { name: true } },
                },
            }),
            this.prisma.team.count({
                where: {
                    id: { in: teamIds },
                },
            }),
        ]);
        return {
            data: teams,
            meta: { total, limit: params.limit || 20, offset: params.offset || 0 },
        };
    }
    // ============================================================
    // Protected methods (require auth)
    // ============================================================
    async create(userId, dto) {
        const game = await this.prisma.game.create({
            data: {
                ...dto,
                organizerId: userId,
                shareLink: this.generateShareLink(),
            },
        });
        // Auto-promote user to ORGANIZER if they have created and conducted games
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                gamesCreated: { increment: 1 },
            },
        });
        this.logger.log(`Game created: ${game.id} by user ${userId}`);
        return game;
    }
    async findAllForOrganizer(userId, params) {
        const where = {
            organizerId: userId,
            deletedAt: null,
        };
        if (params.status) {
            where.status = params.status;
        }
        const [games, total] = await Promise.all([
            this.prisma.game.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    city: true,
                    date: true,
                    status: true,
                    moderationStatus: true,
                    shareLink: true,
                    publishedAt: true,
                    _count: { select: { gameTeams: true, reviews: true } },
                },
            }),
            this.prisma.game.count({ where }),
        ]);
        return {
            data: games,
            meta: { total, limit: params.limit || 20, offset: params.offset || 0 },
        };
    }
    async findOneForOrganizer(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId, organizerId: userId, deletedAt: null },
            include: {
                scenario: true,
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                _count: { select: { gameTeams: true, reviews: true } },
            },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        return game;
    }
    async update(userId, gameId, dto) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        return this.prisma.game.update({
            where: { id: gameId },
            data: dto,
        });
    }
    async remove(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        // Soft delete
        return this.prisma.game.update({
            where: { id: gameId },
            data: { deletedAt: new Date() },
        });
    }
    async submitForModeration(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        if (!game.scenarioId) {
            throw new common_1.ForbiddenException('Cannot submit without a scenario');
        }
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                moderationStatus: 'PENDING',
                submittedAt: new Date(),
            },
        });
    }
    async startGame(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        // Use state machine for transition
        if (!this.gameStateMachine.canTransition(game.status, 'start')) {
            throw new common_1.ForbiddenException(`Cannot start game in status: ${game.status}`);
        }
        // Transition through state machine
        const newStatus = this.gameStateMachine.transition(game.status, 'start');
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: newStatus,
                startedAt: new Date(),
            },
        });
    }
    async finishGame(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this game');
        }
        if (!this.gameStateMachine.canTransition(game.status, 'finish')) {
            throw new common_1.ForbiddenException(`Cannot finish game in status: ${game.status}`);
        }
        const newStatus = this.gameStateMachine.transition(game.status, 'finish');
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: newStatus,
                finishedAt: new Date(),
            },
        });
    }
    generateShareLink() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async uploadCover(userId, gameId, file) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('У вас нет доступа к этой игре');
        }
        // Generate unique filename with UUID
        const ext = path.extname(file.originalname) || this.getExtension(file.mimetype);
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        const destPath = path.join(process.cwd(), 'public', 'uploads', 'covers', filename);
        // Move file from multer temp location to final destination
        fs.renameSync(file.path, destPath);
        // Generate URL
        const url = `/uploads/covers/${filename}`;
        // Update game with image URL
        await this.prisma.game.update({
            where: { id: gameId },
            data: { imageUrl: url },
        });
        this.logger.log(`Cover uploaded for game ${gameId}: ${url}`);
        return { url };
    }
    getExtension(mimeType) {
        const extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        };
        return extensions[mimeType] || '.jpg';
    }
    async publishGame(userId, gameId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        if (game.organizerId !== userId) {
            throw new common_1.ForbiddenException('У вас нет доступа к этой игре');
        }
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
    }
    // ============================================================
    // Admin moderation methods
    // ============================================================
    async findPendingGames(params) {
        const [items, total] = await Promise.all([
            this.prisma.game.findMany({
                where: {
                    moderationStatus: 'PENDING',
                    deletedAt: null,
                },
                include: {
                    organizer: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                    scenario: {
                        select: { id: true, name: true },
                    },
                    _count: {
                        select: { reviews: true, gameTeams: true },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                take: params.limit,
                skip: params.offset,
            }),
            this.prisma.game.count({
                where: {
                    moderationStatus: 'PENDING',
                    deletedAt: null,
                },
            }),
        ]);
        return { items, total };
    }
    async moderateGame(gameId, status, comment, moderatorId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        if (game.moderationStatus !== 'PENDING') {
            throw new common_1.ForbiddenException('Игра уже прошла модерацию');
        }
        const updateData = {
            moderationStatus: status,
            moderatedAt: new Date(),
        };
        if (comment) {
            updateData.moderationComment = comment;
        }
        if (status === 'APPROVED') {
            updateData.status = 'PUBLISHED';
            updateData.publishedAt = new Date();
        }
        return this.prisma.game.update({
            where: { id: gameId },
            data: updateData,
            include: {
                organizer: {
                    select: { id: true, name: true },
                },
            },
        });
    }
    // ============================================================
    // Team registration on game
    // ============================================================
    async registerTeam(gameId, teamId, userId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId, deletedAt: null },
        });
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        // Check if team is already registered
        const existing = await this.prisma.gameTeam.findUnique({
            where: { teamId_gameId: { teamId, gameId } },
        });
        if (existing) {
            throw new common_1.ForbiddenException('Команда уже зарегистрирована на эту игру');
        }
        // Check if user is captain of the team
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            throw new common_1.NotFoundException('Команда не найдена');
        }
        if (team.captainId !== userId) {
            throw new common_1.ForbiddenException('Только капитан может зарегистрировать команду на игру');
        }
        // Check max teams
        if (game.maxTeams) {
            const registeredCount = await this.prisma.gameTeam.count({
                where: { gameId },
            });
            if (registeredCount >= game.maxTeams) {
                throw new common_1.ForbiddenException('Достигнуто максимальное количество команд');
            }
        }
        const gameTeam = await this.prisma.gameTeam.create({
            data: { gameId, teamId },
            include: {
                team: {
                    select: { id: true, name: true, captainId: true },
                },
            },
        });
        this.logger.log(`Team ${teamId} registered for game ${gameId}`);
        return {
            id: gameTeam.id,
            teamId: gameTeam.teamId,
            gameId: gameTeam.gameId,
            team: gameTeam.team,
            joinedAt: gameTeam.joinedAt,
        };
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = GamesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GamesService);
//# sourceMappingURL=games.service.js.map