import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EngineOrchestrator } from '../../engine/orchestrator/engine-orchestrator';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionState } from '../../engine/types/engine.types';

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

    if (game.status !== 'PUBLISHED' && game.status !== 'IN_PROGRESS' && game.status !== 'STARTED') {
      throw new ConflictException('Game is not active');
    }

    // Get start node from scenario
    const startNodeId = game.scenario?.startNodeId || 'node-1';
    const nodes = game.scenario?.nodes ? this.parseNodes(game.scenario.nodes) : [];
    const hasStartNode = nodes.some((n) => n.id === startNodeId);

    if (!hasStartNode) {
      throw new BadRequestException(
        `Start node ${startNodeId} not found in scenario`,
      );
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

      if (existingTeam.captainId !== userId) {
        throw new ConflictException('Only team captain can start a session');
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
      status: sessionState.status,
      startedAt: new Date(sessionState.startedAt),
    };
  }

  async submitAnswer(
    teamId: string,
    gameId: string,
    answer: string,
    nodeId: string,
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

    // Process answer through engine
    const result = await this.engineOrchestrator.processAnswer(
      state.sessionId,
      teamId,
      gameId,
      answer,
      nodeId,
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
      message: result.message,
      nextNode,
      history: result.state.history,
      totalTime: Date.now() - result.state.startedAt,
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
      status: state.status,
      startedAt: new Date(state.startedAt),
      finishedAt: state.finishedAt ? new Date(state.finishedAt) : undefined,
      history: state.history || [],
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
        status: 'FINISHED',
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
