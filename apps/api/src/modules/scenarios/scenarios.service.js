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
var ScenariosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenariosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ScenariosService = ScenariosService_1 = class ScenariosService {
    prisma;
    logger = new common_1.Logger(ScenariosService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        // Debug: log raw dto
        console.log('DEBUG create dto:', JSON.stringify(dto));
        console.log('DEBUG nodes:', JSON.stringify(dto.nodes));
        console.log('DEBUG edges:', JSON.stringify(dto.edges));
        console.log('DEBUG metadata:', JSON.stringify(dto.metadata));
        // Ensure nodes are properly parsed
        let nodes = dto.nodes || [];
        let startNodeId = dto.startNodeId;
        // If dto has extra fields not in Scenario model, extract them
        const { description, price, licenseType, ...scenarioData } = dto;
        // Handle the case where startNodeId is embedded in nodes data
        if (!startNodeId && nodes.length > 0) {
            const startNode = nodes.find((n) => n.type === 'START' || n.id === 'start');
            if (startNode)
                startNodeId = startNode.id;
        }
        // Extract edges and metadata from the raw dto (they come through as extra fields)
        const edges = dto.edges || [];
        const metadata = dto.metadata || {};
        const scenario = await this.prisma.scenario.create({
            data: {
                name: dto.name,
                description: dto.description,
                authorId: userId,
                nodes,
                edges,
                startNodeId: startNodeId || 'node-1',
                price,
                licenseType,
                metadata,
            },
        });
        // Auto-promote user to AUTHOR if they have created a scenario
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                scenariosCreated: { increment: 1 },
            },
        });
        this.logger.log(`Scenario created: ${scenario.id} by user ${userId}`);
        return scenario;
    }
    async findAll(userId, params) {
        const where = {
            authorId: userId,
        };
        if (params.published !== undefined) {
            where.isPublished = params.published;
        }
        const [scenarios, total] = await Promise.all([
            this.prisma.scenario.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    version: true,
                    isPublished: true,
                    createdAt: true,
                },
            }),
            this.prisma.scenario.count({ where }),
        ]);
        return {
            data: scenarios,
            meta: {
                total,
                limit: params.limit || 20,
                offset: params.offset || 0,
            },
        };
    }
    async findOne(userId, scenarioId) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        return scenario;
    }
    async update(userId, scenarioId, dto) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        return this.prisma.scenario.update({
            where: { id: scenarioId },
            data: {
                ...dto,
                version: scenario.version + 1,
            },
        });
    }
    async validate(userId, scenarioId) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        // Basic validation
        const nodes = scenario.nodes;
        const errors = [];
        // Check if start node exists
        const startNodeExists = nodes.some((n) => n.id === scenario.startNodeId);
        if (!startNodeExists) {
            errors.push({
                type: 'error',
                code: 'ERR_START_NODE_NOT_FOUND',
                message: 'Start node not found in nodes array',
            });
        }
        // Check for orphan nodes (nodes not referenced by any transition)
        const referencedNodes = new Set();
        referencedNodes.add(scenario.startNodeId);
        nodes.forEach((node) => {
            if (node.transitions) {
                node.transitions.forEach((t) => {
                    if (t.to) {
                        referencedNodes.add(t.to);
                    }
                });
            }
        });
        const orphanNodes = nodes.filter((n) => !referencedNodes.has(n.id));
        if (orphanNodes.length > 0) {
            errors.push({
                type: 'warning',
                code: 'WARN_ORPHAN_NODES',
                message: `Found ${orphanNodes.length} orphan nodes`,
                nodes: orphanNodes.map((n) => n.id),
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings: errors.filter((e) => e.type === 'warning'),
        };
    }
    async publish(userId, scenarioId, price, licenseType) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        return this.prisma.scenario.update({
            where: { id: scenarioId },
            data: {
                isPublished: true,
                publishedAt: new Date(),
                ...(price !== undefined && { price }),
                ...(licenseType !== undefined && { licenseType }),
            },
        });
    }
    async delete(userId, scenarioId) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        // Delete associated versions first
        await this.prisma.scenarioVersion.deleteMany({
            where: { scenarioId },
        });
        await this.prisma.scenario.delete({
            where: { id: scenarioId },
        });
        this.logger.log(`Scenario deleted: ${scenarioId} by user ${userId}`);
        return { message: 'Scenario deleted successfully' };
    }
    async createVersion(userId, scenarioId, nodes, versionNote) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id: scenarioId },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Scenario not found');
        }
        if (scenario.authorId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this scenario');
        }
        // Save current version
        await this.prisma.scenarioVersion.create({
            data: {
                scenarioId,
                version: scenario.version,
                nodes: JSON.parse(JSON.stringify(scenario.nodes)),
                edges: JSON.parse(JSON.stringify(scenario.edges)),
                startNodeId: scenario.startNodeId,
                createdById: userId,
            },
        });
        // Create new version
        return this.prisma.scenario.update({
            where: { id: scenarioId },
            data: {
                nodes,
                version: scenario.version + 1,
            },
        });
    }
};
exports.ScenariosService = ScenariosService;
exports.ScenariosService = ScenariosService = ScenariosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScenariosService);
//# sourceMappingURL=scenarios.service.js.map