import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EngineOrchestrator } from '../../engine/orchestrator/engine-orchestrator';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionState, HintResponse } from '../../engine/types/engine.types';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engineOrchestrator: EngineOrchestrator,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    // Check if game exists and is active
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
      include: { scenario: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== 'PUBLISHED' && game.status !== 'RUNNING' && game.status !== 'LOBBY') {
      throw new ConflictException('Game is not active');
    }

    // Get start node from scenario
    const nodes = game.scenario?.nodes ? this.parseNodes(game.scenario.nodes) : [];
    let startNodeId = game.scenario?.startNodeId || '';

    // If startNodeId is not set or not found in nodes, use the first node as fallback
    if (!startNodeId || !nodes.some((n) => n.id === startNodeId)) {
      if (nodes.length > 0) {
        startNodeId = nodes[0].id;
      } else {
        throw new BadRequestException(
          `No nodes found in scenario for game ${game.id}`,
        );
      }
    }

    let teamId: string;
    let teamName: string;

    if (dto.teamId) {
      // Use existing team
      const existingTeam = await this.prisma.team.findUnique({
        where: { id: dto.teamId },
      });

      if (!existingTeam) {
        throw new NotFoundException('Team not found');
      }

      // Любой член команды может начать сессию (не только капитан)
      // Проверяем, что пользователь является членом команды
      const isMember = await this.prisma.teamMember.findFirst({
        where: { teamId: dto.teamId, userId },
      });

      if (!isMember) {
        throw new ConflictException('Only team members can start a session');
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
    } else {
      // Check if team with this name already exists for this game
      const existingGameTeam = await this.prisma.gameTeam.findFirst({
        where: {
          gameId: dto.gameId,
          team: { name: dto.teamName },
        },
      });

      if (existingGameTeam) {
        throw new ConflictException('Team with this name already exists in this game');
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
    const sessionState = await this.engineOrchestrator.startSession(
      teamId,
      game.id,
      teamName,
      startNodeId,
    );

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
      stateVersion: sessionState.stateVersion,
      status: sessionState.status,
      startedAt: new Date(sessionState.startedAt),
    };
  }

  async submitAnswer(
    teamId: string,
    gameId: string,
    answer: string,
    nodeId: string,
    userId: string,
    stateVersion?: number,
  ) {
    // Get current session state
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
      orderBy: { sequence: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Session not found');
    }

    const state = snapshot.state as unknown as SessionState;

    // Process answer through engine with userId and stateVersion
    const result = await this.engineOrchestrator.processAnswer(
      state.sessionId,
      teamId,
      gameId,
      answer,
      nodeId,
      userId,
      stateVersion,
    );

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
      stateVersion: result.state.stateVersion,
      message: result.message,
      answerResult: result.answerResult,
      nextNode,
      history: result.state.history,
      totalTime: Date.now() - result.state.startedAt,
    };
  }

  /**
   * Request a hint for the current node.
   */
  async requestHint(teamId: string, gameId: string, userId: string): Promise<HintResponse> {
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
      orderBy: { sequence: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Session not found');
    }

    const state = snapshot.state as unknown as SessionState;

    return this.engineOrchestrator.requestHint(
      state.sessionId,
      teamId,
      gameId,
      userId,
    );
  }

  /**
   * Get team inventory.
   */
  async getInventory(teamId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { teamId },
    });

    if (!inventory) {
      // Create inventory if it doesn't exist
      return this.prisma.inventory.create({
        data: { teamId },
      });
    }

    return inventory;
  }

  /**
   * Add item to team inventory.
   */
  async addInventoryItem(teamId: string, item: Record<string, unknown>, userId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { teamId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const items = (inventory.items as Prisma.JsonArray) || [];

    if (items.length >= inventory.capacity) {
      throw new BadRequestException('Inventory is full');
    }

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...item,
      addedBy: userId,
      addedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.inventory.update({
      where: { teamId },
      data: {
        items: [...items, newItem as Prisma.JsonValue],
      },
    });

    this.logger.log(`Item added to team ${teamId} inventory by user ${userId}: ${JSON.stringify(item)}`);

    return updated;
  }

  /**
   * Remove item from team inventory.
   */
  async removeInventoryItem(teamId: string, itemId: string, userId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { teamId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const items = (inventory.items as Prisma.JsonArray) || [];
    const filtered = items.filter((i: Prisma.JsonValue) => {
      if (typeof i === 'object' && i !== null && !Array.isArray(i)) {
        return (i as Record<string, unknown>).id !== itemId;
      }
      return true;
    });

    if (filtered.length === items.length) {
      throw new NotFoundException('Item not found in inventory');
    }

    const updated = await this.prisma.inventory.update({
      where: { teamId },
      data: { items: filtered as Prisma.JsonArray },
    });

    this.logger.log(`Item ${itemId} removed from team ${teamId} inventory by user ${userId}`);

    return updated;
  }

  /**
   * Get team resources (score, reputation, money, energy, lives).
   */
  async getResources(teamId: string) {
    const resources = await this.prisma.resource.findUnique({
      where: { teamId },
    });

    if (!resources) {
      return this.prisma.resource.create({
        data: { teamId },
      });
    }

    return resources;
  }

  /**
   * Get current node info with timer support.
   */
  async getCurrentNode(teamId: string, gameId: string) {
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
      orderBy: { sequence: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Session not found');
    }

    const state = snapshot.state as unknown as SessionState;

    const nodeInfo = await this.engineOrchestrator.getCurrentNode(
      state.sessionId,
      teamId,
    );

    if (!nodeInfo) {
      throw new NotFoundException('Current node not found');
    }

    // Calculate remaining time if timer is set
    let timeRemaining: number | null = null;
    if (nodeInfo.timer) {
      const currentNodeHistory = state.history
        .filter((h) => h.nodeId === state.currentNodeId)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (currentNodeHistory.length === 0) {
        // Node just started — calculate from now
        timeRemaining = nodeInfo.timer * 1000;
      } else {
        const nodeStartTime = currentNodeHistory[0].timestamp;
        const elapsed = Date.now() - nodeStartTime;
        timeRemaining = Math.max(0, nodeInfo.timer * 1000 - elapsed);
      }
    }

    return {
      ...nodeInfo,
      stateVersion: state.stateVersion,
      timeRemaining,
      score: state.score,
      penalties: state.penalties,
    };
  }

  async getState(teamId: string) {
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
      orderBy: { sequence: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException('Session not found');
    }

    const state = snapshot.state as unknown as SessionState;

    return {
      sessionId: state.sessionId,
      teamId: state.teamId,
      teamName: state.teamName,
      currentNodeId: state.currentNodeId,
      score: state.score,
      penalties: state.penalties,
      stateVersion: state.stateVersion,
      status: state.status,
      startedAt: new Date(state.startedAt),
      finishedAt: state.finishedAt ? new Date(state.finishedAt) : undefined,
      history: state.history || [],
    };
  }

  /**
   * getSessionByTeamAndGame: получить последнюю сессию команды для данной игры.
   * Используется для восстановления sessionId при повторном входе.
   */
  async getSessionByTeamAndGame(teamId: string, gameId: string) {
    // Проверяем, что команда участвует в этой игре
    const gameTeam = await this.prisma.gameTeam.findUnique({
      where: { teamId_gameId: { teamId, gameId } },
    });

    if (!gameTeam) {
      throw new NotFoundException('Team is not registered for this game');
    }

    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
      orderBy: { sequence: 'desc' },
    });

    if (!snapshot) {
      return {
        sessionId: null,
        teamId,
        status: 'not_started',
      };
    }

    const state = snapshot.state as Record<string, unknown>;

    return {
      sessionId: (state?.sessionId as string) || snapshot.id,
      teamId,
      status: (state?.status as string) || 'unknown',
      score: (state?.score as number) || 0,
      currentNodeId: (state?.currentNodeId as string) || null,
    };
  }

  async finish(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        status: 'ACTIVE',
        finishedAt: new Date(),
      },
    });
  }

  private parseNodes(nodes: unknown): Array<{ id: string; type: string; question: string }> {
    if (!nodes) return [];
    if (Array.isArray(nodes)) return nodes as Array<{ id: string; type: string; question: string }>;
    if (typeof nodes === 'string') {
      try {
        return JSON.parse(nodes);
      } catch {
        return [];
      }
    }
    return [];
  }
}
