import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  Event,
  EventType,
  IEventStore,
  GameStatus,
  TeamStatus,
  SessionState,
  ScenarioNode,
  NodeType,
  TransitionType,
} from '../types/engine.types';
import { EventStore } from '../event-store/event-store';
import {
  GameStateMachine,
  TeamStateMachine,
} from '../state-machine/state-machine';
import {
  PluginRegistry,
  PluginSandbox,
  ExecutionContextImpl,
  MissionResult,
} from '../plugin-sdk/plugin-sdk';
import { LockManager } from '../lock-manager/lock-manager';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ProcessAnswerResult {
  success: boolean;
  state: SessionState;
  nextNode?: ScenarioNode | null;
  events: Event[];
  message: string;
  transitionType: TransitionType;
}

export interface CurrentNodeInfo {
  id: string;
  type: NodeType;
  question: string;
  hint?: string;
  mediaUrls?: string[];
  options?: string[];
  timer?: number;
}

@Injectable()
export class EngineOrchestrator {
  private readonly logger = new Logger(EngineOrchestrator.name);

  constructor(
    private readonly eventStore: IEventStore,
    private readonly gameStateMachine: GameStateMachine,
    private readonly teamStateMachine: TeamStateMachine,
    private readonly pluginRegistry: PluginRegistry,
    private readonly pluginSandbox: PluginSandbox,
    private readonly lockManager: LockManager,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Process a player answer for a given node.
   */
  async processAnswer(
    sessionId: string,
    teamId: string,
    gameId: string,
    answer: string,
    nodeId: string,
  ): Promise<ProcessAnswerResult> {
    // 1. Acquire distributed lock
    const acquired = await this.lockManager.acquire(sessionId);
    if (!acquired) {
      throw new BadRequestException('Session is being processed');
    }

    try {
      // 2. Load current session state
      const state = await this.loadSessionState(sessionId, teamId);
      if (!state) {
        throw new NotFoundException('Session not found');
      }

      // 3. Validate session is active
      this.validateSessionActive(state);

      // 4. Load and validate node
      const node = await this.loadNode(gameId, nodeId);
      if (!node) {
        throw new NotFoundException(`Node ${nodeId} not found in game scenario`);
      }

      // 5. Validate node belongs to current session
      if (nodeId !== state.currentNodeId) {
        throw new BadRequestException(
          `Answer is for node ${nodeId}, but current node is ${state.currentNodeId}`,
        );
      }

      // 6. Find plugin for node type
      const plugin = this.pluginRegistry.get(node.type);
      if (!plugin) {
        throw new BadRequestException(`No plugin registered for node type: ${node.type}`);
      }

      // 7. Evaluate answer through plugin (Rules Engine)
      const pluginConfig = this.buildPluginConfig(node);
      const context = new ExecutionContextImpl(this.toPlainRecord(state), answer);

      const pluginResult: MissionResult = await this.pluginSandbox.execute(
        plugin,
        pluginConfig,
        context,
      );

      // 8. Determine transition type
      const transitionType: TransitionType = pluginResult.success ? 'success' : 'fail';

      // 9. Generate events
      const events = this.generateEvents(
        sessionId,
        teamId,
        gameId,
        nodeId,
        answer,
        pluginResult,
        transitionType,
        state.history.length + 1,
      );

      // 10. Resolve next node via transitions
      const nextNode = this.resolveNextNode(node, transitionType);

      // 11. Update state
      const newState = this.applyTransition(
        state,
        nodeId,
        transitionType,
        pluginResult,
        nextNode,
      );

      // 12. Transition state machine
      this.transitionTeamState(newState, transitionType, nextNode);

      // 13. Save events and state snapshot
      await this.eventStore.appendMany(events);
      await this.saveStateSnapshot(sessionId, newState);

      this.logger.log(
        `Answer processed for session ${sessionId}: ${
          pluginResult.success ? 'accepted' : 'rejected'
        } — ${nodeId} -> ${nextNode?.id || 'FINISH'}`,
      );

      return {
        success: pluginResult.success,
        state: newState,
        nextNode,
        events,
        message: pluginResult.success
          ? 'Answer accepted'
          : pluginResult.reason || 'Answer rejected',
        transitionType,
      };
    } finally {
      await this.lockManager.release(sessionId);
    }
  }

  /**
   * Start a new session for a team.
   */
  async startSession(
    teamId: string,
    gameId: string,
    teamName: string,
    startNodeId: string,
  ): Promise<SessionState> {
    // Verify game exists and start node exists
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { scenario: true },
    });

    if (!game) {
      throw new NotFoundException(`Game ${gameId} not found`);
    }

    if (!game.scenario) {
      throw new BadRequestException(`Game ${gameId} has no scenario`);
    }

    const nodes = this.parseNodes(game.scenario.nodes);
    const startNode = nodes.find((n) => n.id === startNodeId);
    if (!startNode) {
      throw new BadRequestException(
        `Start node ${startNodeId} not found in scenario`,
      );
    }

    // Create initial state
    const state: SessionState = {
      sessionId: uuid(),
      teamId,
      teamName,
      gameId,
      currentNodeId: startNodeId,
      score: 0,
      penalties: 0,
      status: TeamStatus.WAITING_ANSWER,
      startedAt: Date.now(),
      history: [],
    };

    // Generate session events
    const events: Event[] = [
      {
        id: uuid(),
        type: EventType.SESSION_CREATE,
        gameId,
        teamId,
        payload: { teamName },
        timestamp: Date.now(),
        sequence: 1,
        version: 1,
      },
      {
        id: uuid(),
        type: EventType.NODE_ENTER,
        gameId,
        teamId,
        nodeId: startNodeId,
        payload: { question: startNode.question, nodeType: startNode.type },
        timestamp: Date.now(),
        sequence: 2,
        version: 1,
      },
    ];

    await this.eventStore.appendMany(events);
    await this.saveStateSnapshot(state.sessionId, state);

    this.logger.log(`Session started for team ${teamId} in game ${gameId}`);
    return state;
  }

  /**
   * Get current node info for a session.
   */
  async getCurrentNode(
    sessionId: string,
    teamId: string,
  ): Promise<CurrentNodeInfo | null> {
    const state = await this.loadSessionState(sessionId, teamId);
    if (!state) return null;

    // Load game to get scenario nodes
    const game = await this.prisma.game.findUnique({
      where: { id: state.gameId },
      include: { scenario: true },
    });

    if (!game?.scenario) return null;

    const nodes = this.parseNodes(game.scenario.nodes);
    const currentNode = nodes.find((n) => n.id === state.currentNodeId);

    if (!currentNode) return null;

    return {
      id: currentNode.id,
      type: currentNode.type,
      question: currentNode.question,
      hint: currentNode.hint,
      mediaUrls: currentNode.mediaUrls,
      options: currentNode.options,
      timer: currentNode.timer,
    };
  }

  /**
   * Get session history.
   */
  async getSessionHistory(
    sessionId: string,
    teamId: string,
  ): Promise<SessionState | null> {
    return this.loadSessionState(sessionId, teamId);
  }

  /**
   * Get available transitions for current node.
   */
  async getAvailableTransitions(
    sessionId: string,
    teamId: string,
  ): Promise<string[]> {
    const state = await this.loadSessionState(sessionId, teamId);
    if (!state) return [];

    const game = await this.prisma.game.findUnique({
      where: { id: state.gameId },
      include: { scenario: true },
    });

    if (!game?.scenario) return [];

    const nodes = this.parseNodes(game.scenario.nodes);
    const currentNode = nodes.find((n) => n.id === state.currentNodeId);
    if (!currentNode) return [];

    return currentNode.transitions.map((t) => t.when);
  }

  // ==========================================================================
  // Plugin config builders for each node type
  // ==========================================================================

  private buildPluginConfig(node: ScenarioNode): Record<string, unknown> {
    switch (node.type) {
      case 'text':
      case 'code':
        return {
          validation: {
            mode: 'exact',
            answers: node.answer ? [node.answer] : [],
          },
          rewards: { score: 10 },
          penalties: { score: 0 },
        };

      case 'choice':
        return {
          validation: {
            mode: 'exact',
            answers: node.answer ? [node.answer] : [],
          },
          rewards: { score: 10 },
          penalties: { score: 0 },
        };

      case 'qr':
        return {
          validation: {
            mode: 'exact',
            answers: node.answer ? [node.answer] : [],
          },
          rewards: { score: 15 },
          penalties: { score: 0 },
        };

      case 'gps':
        return {
          validation: {
            mode: 'distance',
            radius: node.radius || 50, // meters
          },
          rewards: { score: 20 },
          penalties: { score: 0 },
        };

      case 'photo':
        return {
          validation: {
            mode: 'manual', // requires human review
          },
          rewards: { score: 15 },
          penalties: { score: 0 },
        };

      case 'timer':
        return {
          validation: {
            mode: 'time_limit',
            timeLimit: node.timer || 60,
          },
          rewards: { score: 10 },
          penalties: { score: 0 },
        };

      default:
        return {
          validation: { mode: 'exact', answers: [] },
          rewards: { score: 0 },
          penalties: { score: 0 },
        };
    }
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private validateSessionActive(state: SessionState): void {
    if (state.status === TeamStatus.FINISHED) {
      throw new BadRequestException('Session has already finished');
    }
    if (state.status === TeamStatus.NODE_COMPLETED) {
      throw new BadRequestException(
        'Node already completed — waiting for transition',
      );
    }
  }

  private async loadSessionState(
    sessionId: string,
    teamId: string,
  ): Promise<SessionState | null> {
    // Try to load from database snapshot
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { id: sessionId },
      orderBy: { sequence: 'desc' },
    });

    if (snapshot) {
      return snapshot.state as unknown as SessionState;
    }

    return null;
  }

  private async loadNode(
    gameId: string,
    nodeId: string,
  ): Promise<ScenarioNode | null> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { scenario: true },
    });

    if (!game?.scenario) return null;

    const nodes = this.parseNodes(game.scenario.nodes);
    return nodes.find((n) => n.id === nodeId) || null;
  }

  private parseNodes(nodes: unknown): ScenarioNode[] {
    if (!nodes) return [];
    if (Array.isArray(nodes)) return nodes as ScenarioNode[];
    if (typeof nodes === 'string') {
      try {
        return JSON.parse(nodes);
      } catch {
        return [];
      }
    }
    if (typeof nodes === 'object') {
      const obj = nodes as Record<string, unknown>;
      return Array.isArray(obj.nodes)
        ? (obj.nodes as ScenarioNode[])
        : (obj as unknown as ScenarioNode[]);
    }
    return [];
  }

  /**
   * Resolve the next node using transitions array (not hardcoded nextNodeId).
   */
  private resolveNextNode(
    currentNode: ScenarioNode,
    transitionType: TransitionType,
  ): ScenarioNode | null {
    // 1. Try to find exact transition
    const transition = currentNode.transitions.find(
      (t) => t.when === transitionType,
    );

    if (transition?.to) {
      return {
        id: transition.to,
        type: 'text' as NodeType, // placeholder — actual type loaded when needed
        question: 'Next node',
        transitions: [],
      };
    }

    // 2. Fallback: if success and no explicit transition, try to find
    // the next sequential node (linear scenario)
    if (transitionType === 'success') {
      // No transitions defined — treat as linear, no next node (end of game)
      return null;
    }

    // 3. For fail — no retry transition means node fails
    return null;
  }

  /**
   * Apply state transition: update score, penalties, history, currentNodeId.
   */
  private applyTransition(
    state: SessionState,
    currentNodeId: string,
    transitionType: TransitionType,
    pluginResult: MissionResult,
    nextNode: ScenarioNode | null,
  ): SessionState {
    const scoreDelta = pluginResult.success ? (pluginResult.score || 10) : 0;
    const penaltyDelta = pluginResult.success ? 0 : 1;

    return {
      ...state,
      score: state.score + scoreDelta,
      penalties: state.penalties + penaltyDelta,
      history: [
        ...state.history,
        {
          nodeId: currentNodeId,
          result: transitionType === 'success' ? 'success' : 'fail',
          timestamp: Date.now(),
          score: scoreDelta,
        },
      ],
      currentNodeId: nextNode?.id || state.currentNodeId,
      status: nextNode
        ? TeamStatus.WAITING_ANSWER
        : TeamStatus.FINISHED,
      finishedAt: nextNode ? undefined : Date.now(),
    };
  }

  /**
   * Transition team state machine based on the answer result.
   */
  private transitionTeamState(
    state: SessionState,
    transitionType: TransitionType,
    nextNode: ScenarioNode | null,
  ): void {
    if (nextNode) {
      // Transition to next node
      if (transitionType === 'success') {
        // WAITING_ANSWER -> NODE_COMPLETED -> NEXT_NODE -> WAITING_ANSWER
        if (this.teamStateMachine.canTransition(state.status, 'answerAccepted')) {
          this.teamStateMachine.transition(state.status, 'answerAccepted');
        }
        if (this.teamStateMachine.canTransition(state.status, 'transition')) {
          this.teamStateMachine.transition(state.status, 'transition');
        }
        if (this.teamStateMachine.canTransition(state.status, 'assignNode')) {
          this.teamStateMachine.transition(state.status, 'assignNode');
        }
      }
    } else {
      // No next node — game finished
      if (this.teamStateMachine.canTransition(state.status, 'gameFinish')) {
        this.teamStateMachine.transition(state.status, 'gameFinish');
      }
    }
  }

  /**
   * Generate events for the answer processing.
   */
  private generateEvents(
    sessionId: string,
    teamId: string,
    gameId: string,
    nodeId: string,
    answer: string,
    pluginResult: MissionResult,
    transitionType: TransitionType,
    startSequence: number,
  ): Event[] {
    const events: Event[] = [];
    let seq = startSequence;

    // 1. Player answer submitted
    events.push({
      id: uuid(),
      type: EventType.PLAYER_ANSWER,
      gameId,
      teamId,
      nodeId,
      payload: { answer },
      timestamp: Date.now(),
      sequence: seq++,
      version: 1,
    });

    // 2. Answer accepted or rejected
    if (pluginResult.success) {
      events.push({
        id: uuid(),
        type: EventType.ANSWER_ACCEPTED,
        gameId,
        teamId,
        nodeId,
        payload: { score: pluginResult.score || 10, answer },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });

      events.push({
        id: uuid(),
        type: EventType.NODE_COMPLETED,
        gameId,
        teamId,
        nodeId,
        payload: { score: pluginResult.score || 10 },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });

      // Score update event
      events.push({
        id: uuid(),
        type: EventType.SCORE_UPDATE,
        gameId,
        teamId,
        nodeId,
        payload: { delta: pluginResult.score || 10, reason: 'correct_answer' },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });
    } else {
      events.push({
        id: uuid(),
        type: EventType.ANSWER_REJECTED,
        gameId,
        teamId,
        nodeId,
        payload: { reason: pluginResult.reason || 'incorrect', answer },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });

      events.push({
        id: uuid(),
        type: EventType.NODE_FAILED,
        gameId,
        teamId,
        nodeId,
        payload: { reason: pluginResult.reason || 'incorrect' },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });

      // Penalty event
      events.push({
        id: uuid(),
        type: EventType.PENALTY_APPLIED,
        gameId,
        teamId,
        nodeId,
        payload: { delta: 1, reason: 'incorrect_answer' },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });
    }

    // 3. If there's a next node, emit NODE_ENTER
    if (pluginResult.next) {
      events.push({
        id: uuid(),
        type: EventType.NODE_ENTER,
        gameId,
        teamId,
        nodeId: pluginResult.next,
        payload: { from: nodeId },
        timestamp: Date.now(),
        sequence: seq++,
        version: 1,
      });
    }

    // 4. State sync event
    events.push({
      id: uuid(),
      type: EventType.STATE_SYNC,
      gameId,
      teamId,
      nodeId,
      payload: { transitionType },
      timestamp: Date.now(),
      sequence: seq++,
      version: 1,
    });

    return events;
  }

  private async saveStateSnapshot(
    sessionId: string,
    state: SessionState,
  ): Promise<void> {
    await this.prisma.sessionState.create({
      data: {
        id: sessionId,
        teamId: state.teamId,
        state: JSON.parse(JSON.stringify(state)),
        sequence: state.history.length,
      },
    });
  }

  private toPlainRecord(obj: unknown): Record<string, unknown> {
    if (obj === null || obj === undefined) return {};
    if (typeof obj !== 'object') return { value: obj };
    return JSON.parse(JSON.stringify(obj));
  }
}
