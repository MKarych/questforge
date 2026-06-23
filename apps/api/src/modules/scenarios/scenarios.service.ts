import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateScenarioDto) {
    // Debug: log raw dto
    console.log('DEBUG create dto:', JSON.stringify(dto));
    console.log('DEBUG nodes:', JSON.stringify(dto.nodes));
    // Ensure nodes are properly parsed
    let nodes = dto.nodes || [];
    const edges: any[] = [];
    let startNodeId = dto.startNodeId;

    // If dto has extra fields not in Scenario model, extract them
    const { description, price, licenseType, ...scenarioData } = dto;

    // Handle the case where startNodeId is embedded in nodes data
    if (!startNodeId && nodes.length > 0) {
      const startNode = nodes.find((n: any) => n.type === 'START' || n.id === 'start');
      if (startNode) startNodeId = startNode.id;
    }

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

  async findAll(userId: string, params: { published?: boolean; limit?: number; offset?: number }) {
    const where: any = {
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

  async findOne(userId: string, scenarioId: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (scenario.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this scenario');
    }

    return scenario;
  }

  async update(userId: string, scenarioId: string, dto: Partial<CreateScenarioDto>) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (scenario.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this scenario');
    }

    return this.prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        ...dto,
        version: scenario.version + 1,
      },
    });
  }

  async validate(userId: string, scenarioId: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (scenario.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this scenario');
    }

    // Basic validation
    const nodes = scenario.nodes as any[];
    const errors: any[] = [];

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
    const referencedNodes = new Set<string>();
    referencedNodes.add(scenario.startNodeId);

    nodes.forEach((node) => {
      if (node.transitions) {
        node.transitions.forEach((t: any) => {
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

  async publish(userId: string, scenarioId: string, price?: number, licenseType?: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (scenario.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this scenario');
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

  async createVersion(userId: string, scenarioId: string, nodes: any[], versionNote?: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }

    if (scenario.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this scenario');
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
}
