"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SessionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const engine_orchestrator_1 = require("../../engine/orchestrator/engine-orchestrator");
let SessionsService = SessionsService_1 = class SessionsService {
    prisma;
    engineOrchestrator;
    logger = new common_1.Logger(SessionsService_1.name);
    constructor(prisma, engineOrchestrator) {
        this.prisma = prisma;
        this.engineOrchestrator = engineOrchestrator;
    }
    async create(userId, dto) {
        // Check if game exists and is active
        const game = await this.prisma.game.findUnique({
            where: { id: dto.gameId },
            include: { scenario: true },
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        if (game.status !== 'PUBLISHED' && game.status !== 'IN_PROGRESS' && game.status !== 'STARTED') {
            throw new common_1.ConflictException('Game is not active');
        }
        // Get start node from scenario
        const startNodeId = game.scenario?.startNodeId || 'node-1';
        const nodes = game.scenario?.nodes ? this.parseNodes(game.scenario.nodes) : [];
        const hasStartNode = nodes.some((n) => n.id === startNodeId);
        if (!hasStartNode) {
            throw new common_1.BadRequestException(`Start node ${startNodeId} not found in scenario`);
        }
        let teamId;
        let teamName;
        if (dto.teamId) {
            // Use existing team
            const existingTeam = await this.prisma.team.findUnique({
                where: { id: dto.teamId },
            });
            if (!existingTeam) {
                throw new common_1.NotFoundException('Team not found');
            }
            if (existingTeam.captainId !== userId) {
                throw new common_1.ConflictException('Only team captain can start a session');
            }
            teamId = existingTeam.id;
            teamName = existingTeam.name;
            // Check if team is already registered on this game
            const existingGameTeam = await this.prisma.gameTeam.findUnique({
                where: { teamId_gameId: { teamId, gameId: dto.gameId } },
            });
            if (!existingGameTeam) {
                // Register team on game if not already registered
                await this.prisma.gameTeam.create({
                    data: { teamId, gameId: dto.gameId },
                });
            }
        }
        else {
            // Check if team with this name already exists for this game
            const existingGameTeam = await this.prisma.gameTeam.findFirst({
                where: {
                    gameId: dto.gameId,
                    team: { name: dto.teamName },
                },
            });
            if (existingGameTeam) {
                throw new common_1.ConflictException('Team with this name already exists in this game');
            }
            // Create new team
            const team = await this.prisma.team.create({
                data: {
                    name: dto.teamName,
                    slug: dto.teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                    captainId: userId,
                },
            });
            teamId = team.id;
            teamName = dto.teamName;
            // Create inventory and resources for team
            await this.prisma.inventory.create({
                data: { teamId },
            });
            await this.prisma.resource.create({
                data: { teamId },
            });
            // Link team to game
            await this.prisma.gameTeam.create({
                data: { teamId, gameId: dto.gameId },
            });
        }
        // Start session in engine
        const sessionState = await this.engineOrchestrator.startSession(teamId, game.id, teamName, startNodeId);
        // Get first node info
        const firstNode = nodes.find((n) => n.id === startNodeId) || {
            id: startNodeId,
            type: 'text',
            question: 'Welcome to the game!',
        };
        return {
            sessionId: sessionState.sessionId,
            teamId,
            teamName,
            currentNode: {
                id: firstNode.id,
                type: firstNode.type,
                title: firstNode.question,
                description: firstNode.question,
            },
            score: 0,
            status: sessionState.status,
            startedAt: new Date(sessionState.startedAt),
        };
    }
    async submitAnswer(teamId, gameId, answer, nodeId) {
        // Get current session state
        const snapshot = await this.prisma.sessionState.findFirst({
            where: { teamId },
            orderBy: { sequence: 'desc' },
        });
        if (!snapshot) {
            throw new common_1.NotFoundException('Session not found');
        }
        const state = snapshot.state;
        // Process answer through engine
        const result = await this.engineOrchestrator.processAnswer(state.sessionId, teamId, gameId, answer, nodeId);
        // Get next node from scenario
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { scenario: true },
        });
        const nextNode = result.nextNode
            ? {
                id: result.nextNode.id,
                type: result.nextNode.type,
                title: result.nextNode.question,
                description: result.nextNode.question,
            }
            : null;
        return {
            status: result.success ? 'success' : 'fail',
            score: result.state.score,
            penalties: result.state.penalties,
            message: result.message,
            nextNode,
            history: result.state.history,
            totalTime: Date.now() - result.state.startedAt,
        };
    }
    async getState(teamId) {
        const snapshot = await this.prisma.sessionState.findFirst({
            where: { teamId },
            orderBy: { sequence: 'desc' },
        });
        if (!snapshot) {
            throw new common_1.NotFoundException('Session not found');
        }
        const state = snapshot.state;
        return {
            sessionId: state.sessionId,
            teamId: state.teamId,
            teamName: state.teamName,
            currentNodeId: state.currentNodeId,
            score: state.score,
            penalties: state.penalties,
            status: state.status,
            startedAt: new Date(state.startedAt),
            finishedAt: state.finishedAt ? new Date(state.finishedAt) : undefined,
            history: state.history || [],
        };
    }
    async finish(teamId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return this.prisma.team.update({
            where: { id: teamId },
            data: {
                status: 'ACTIVE',
                finishedAt: new Date(),
            },
        });
    }
    parseNodes(nodes) {
        if (!nodes)
            return [];
        if (Array.isArray(nodes))
            return nodes;
        if (typeof nodes === 'string') {
            try {
                return JSON.parse(nodes);
            }
            catch {
                return [];
            }
        }
        return [];
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = SessionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        engine_orchestrator_1.EngineOrchestrator])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map