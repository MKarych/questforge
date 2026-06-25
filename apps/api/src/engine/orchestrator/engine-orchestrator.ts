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
  AnswerCommand,
  AnswerResult,
  HintResponse,
  RealtimeEvent,
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
  answerResult: AnswerResult;
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
    private readonly eventStore: EventStore,
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
   * Process a player answer for a given node with conflict resolution.
   * Implements spec 59: stateVersion check, first-answer-is-canonical.
   */
  async processAnswer(
    sessionId: string,
    teamId: string,
    gameId: string,
    answer: string,
    nodeId: string,
    userId: string,
    stateVersion?: number,
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

      // 4. Check stateVersion for optimistic locking (spec 59)
      if (stateVersion !== undefined && stateVersion !== state.stateVersion) {
        return {
          success: false,
          state,
          nextNode: null,
          events: [],
          message: 'Ваш ответ относится к устаревшему состоянию. Обновите страницу.',
          transitionType: 'fail',
          answerResult: {
            status: 'stale',
            reason: 'STATE_VERSION_MISMATCH',
            nodeId,
            currentVersion: state.stateVersion,
          },
        };
      }

      // 5. Check if node is already resolved (first-answer-is-canonical)
      const nodeAlreadyResolved = state.history.some((h) => h.nodeId === nodeId && h.result === 'success');
      if (nodeAlreadyResolved) {
        return {
          success: false,
          state,
          nextNode: null,
          events: [],
          message: 'Это задание уже выполнено вашей командой.',
          transitionType: 'fail',
          answerResult: {
            status: 'ignored',
            reason: 'NODE_ALREADY_RESOLVED',
            nodeId,
          },
        };
      }

      // 6. Load and validate node
      const node = await this.loadNode(gameId, nodeId);
      if (!node) {
        throw new NotFoundException(`Node ${nodeId} not found in game scenario`);
      }

      // 7. Validate node belongs to current session
      if (nodeId !== state.currentNodeId) {
        throw new BadRequestException(
          `Answer is for node ${nodeId}, but current node is ${state.currentNodeId}`,
        );
      }

      // 8. Find plugin for node type
      const plugin = this.pluginRegistry.get(node.type);
      if (!plugin) {
        throw new BadRequestException(`No plugin registered for node type: ${node.type}`);
      }

      // 9. Evaluate answer through plugin (Rules Engine)
      const pluginConfig = this.buildPluginConfig(node);
      const context = new ExecutionContextImpl(this.toPlainRecord(state), answer);

      const pluginResult: MissionResult = await this.pluginSandbox.execute(
        plugin,
        pluginConfig,
        context,
      );

      // 10. Determine transition type
      const transitionType: TransitionType = pluginResult.success ? 'success' : 'fail';

      // 11. Generate events with actorUserId
      const events = this.generateEvents(
        sessionId,
        teamId,
        gameId,
        nodeId,
        answer,
        pluginResult,
        transitionType,
        state.history.length + 1,
        userId,
      );

      // 12. Resolve next node via transitions
      const nextNode = this.resolveNextNode(node, transitionType);

      // 13. Update state with incremented stateVersion
      const newState = this.applyTransition(
        state,
        nodeId,
        transitionType,
        pluginResult,
        nextNode,
        userId,
      );

      // 14. Transition state machine
      this.transitionTeamState(newState, transitionType, nextNode);

      // 15. Save events and state snapshot
      await this.eventStore.appendMany(events);
      await this.saveStateSnapshot(sessionId, newState);

      this.logger.log(
        `Answer processed for session ${sessionId} by user ${userId}: ${
          pluginResult.success ? 'accepted' : 'rejected'
        } — ${nodeId} -> ${nextNode?.id || 'FINISH'}`,
      );

      return {
        success: pluginResult.success,
        state: newState,
        nextNode,
        events,
        message: pluginResult.success
          ? 'Ответ принят!'
          : pluginResult.reason || 'Неправильный ответ. Попробуйте ещё раз.',
        transitionType,
        answerResult: {
          status: pluginResult.success ? 'accepted' : 'ignored',
          nodeId,
        },
      };
    } finally {
      await this.lockManager.release(sessionId);
    }
  }

  /**
   * Request a hint for the current node.
   * Hint is deducted once per team per node (spec 57, 59).
   */
  async requestHint(
    sessionId: string,
    teamId: string,
    gameId: string,
    userId: string,
  ): Promise<HintResponse> {
    const state = await this.loadSessionState(sessionId, teamId);
    if (!state) {
      throw new NotFoundException('Session not found');
    }

    const node = await this.loadNode(gameId, state.currentNodeId);
    if (!node) {
      throw new NotFoundException('Current node not found');
    }

    if (!node.hint) {
      throw new BadRequestException('No hint available for this node');
    }

    // Check if hint was already revealed for this node
    const hintAlreadyRevealed = state.history.some(
      (h) => h.nodeId === state.currentNodeId && h.actorUserId === '__hint__',
    );

    if (hintAlreadyRevealed) {
      return {
        hint: node.hint,
        penalty: 0,
        alreadyRevealed: true,
      };
    }

    // Apply penalty for hint (spec 60: hints cost points)
    const hintPenalty = node.penalty || 5;

    // Record hint in history
    const hintEvent: Event = {
      id: uuid(),
      type: EventType.HINT_REVEALED,
      gameId,
      teamId,
      nodeId: state.currentNodeId,
      payload: { hint: node.hint, penalty: hintPenalty, userId },
      timestamp: Date.now(),
      sequence: state.history.length + 1,
      version: 1,
    };

    const updatedState: SessionState = {
      ...state,
      penalties: state.penalties + hintPenalty,
      score: Math.max(0, state.score - hintPenalty),
      stateVersion: state.stateVersion + 1,
      history: [
        ...state.history,
        {
          nodeId: state.currentNodeId,
          result: 'fail',
          timestamp: Date.now(),
          score: -hintPenalty,
          actorUserId: '__hint__',
        },
      ],
    };

    await this.eventStore.append(hintEvent);
    await this.saveStateSnapshot(sessionId, updatedState);

    this.logger.log(`Hint revealed for team ${teamId} on node ${state.currentNodeId}, penalty: ${hintPenalty}`);

    return {
      hint: node.hint,
      penalty: hintPenalty,
      alreadyRevealed: false,
    };
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

    // Create initial state with stateVersion = 1
    const state: SessionState = {
      sessionId: uuid(),
      teamId,
      teamName,
      gameId,
      currentNodeId: startNodeId,
      score: 0,
      penalties: 0,
      status: TeamStatus.WAITING_ANSWER,
      stateVersion: 1,
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
    // Try to load from database snapshot by teamId (most recent)
    const snapshot = await this.prisma.sessionState.findFirst({
      where: { teamId },
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

    if (!game) {
      this.logger.warn(`loadNode: game ${gameId} not found`);
      return null;
    }

    if (!game.scenario) {
      this.logger.warn(`loadNode: game ${gameId} has no scenario attached`);
      return null;
    }

    this.logger.debug(
      `loadNode: game=${gameId}, scenario=${game.scenario.id}, nodes type=${typeof game.scenario.nodes}`,
    );

    const nodes = this.parseNodes(game.scenario.nodes);
    this.logger.debug(`loadNode: parsed ${nodes.length} nodes, looking for nodeId=${nodeId}`);

    const found = nodes.find((n) => n.id === nodeId) || null;
    if (!found) {
      this.logger.warn(
        `loadNode: node ${nodeId} not found among ${nodes.length} nodes in game ${gameId}`,
      );
    }

    return found;
  }

  private parseNodes(nodes: unknown): ScenarioNode[] {
    if (!nodes) {
      this.logger.warn(`parseNodes: nodes is null/undefined`);
      return [];
    }

    // Case 1: Already an array
    if (Array.isArray(nodes)) {
      this.logger.debug(`parseNodes: array (${nodes.length} nodes)`);
      return nodes as ScenarioNode[];
    }

    // Case 2: JSON string
    if (typeof nodes === 'string') {
      try {
        const parsed = JSON.parse(nodes);
        if (Array.isArray(parsed)) {
          this.logger.debug(`parseNodes: parsed string -> array (${parsed.length} nodes)`);
          return parsed as ScenarioNode[];
        }
        this.logger.warn(`parseNodes: parsed string is not array, type=${typeof parsed}`);
        return [];
      } catch (e) {
        this.logger.warn(`parseNodes: failed to parse JSON string: ${(e as Error).message}`);
        return [];
      }
    }

    // Case 3: Plain object (may contain nodes array or be a serialized wrapper)
    if (typeof nodes === 'object') {
      const obj = nodes as Record<string, unknown>;

      // Check for wrapped format: { nodes: [...] }
      if (obj.nodes && Array.isArray(obj.nodes)) {
        this.logger.debug(`parseNodes: object with .nodes array (${obj.nodes.length} nodes)`);
        return obj.nodes as ScenarioNode[];
      }

      // Check if object has numeric keys (array-like object from serialization)
      const keys = Object.keys(obj);
      if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
        this.logger.debug(`parseNodes: array-like object with ${keys.length} items`);
        return Object.values(obj) as ScenarioNode[];
      }

      this.logger.warn(`parseNodes: unknown object format, keys=${keys.join(',')}`);
      return [];
    }

    this.logger.warn(`parseNodes: unexpected type=${typeof nodes}`);
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
   * Increments stateVersion for optimistic locking.
   */
  private applyTransition(
    state: SessionState,
    currentNodeId: string,
    transitionType: TransitionType,
    pluginResult: MissionResult,
    nextNode: ScenarioNode | null,
    userId?: string,
  ): SessionState {
    const scoreDelta = pluginResult.success ? (pluginResult.score || 10) : 0;
    const penaltyDelta = pluginResult.success ? 0 : 1;

    return {
      ...state,
      score: state.score + scoreDelta,
      penalties: state.penalties + penaltyDelta,
      stateVersion: state.stateVersion + 1,
      history: [
        ...state.history,
        {
          nodeId: currentNodeId,
          result: transitionType === 'success' ? 'success' : 'fail',
          timestamp: Date.now(),
          score: scoreDelta,
          actorUserId: userId,
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
    userId?: string,
  ): Event[] {
    const events: Event[] = [];
    let seq = startSequence;

    // 1. Player answer submitted with actorUserId
    events.push({
      id: uuid(),
      type: EventType.PLAYER_ANSWER,
      gameId,
      teamId,
      nodeId,
      payload: { answer, userId: userId || 'unknown' },
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
        payload: { score: pluginResult.score || 10, answer, userId: userId || 'unknown' },
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
        payload: { reason: pluginResult.reason || 'incorrect', answer, userId: userId || 'unknown' },
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
    // Use upsert to handle both first save and subsequent saves
    const existing = await this.prisma.sessionState.findFirst({
      where: { teamId: state.teamId },
      orderBy: { sequence: 'desc' },
    });

    if (existing) {
      await this.prisma.sessionState.create({
        data: {
          teamId: state.teamId,
          state: JSON.parse(JSON.stringify(state)),
          sequence: state.history.length,
        },
      });
    } else {
      await this.prisma.sessionState.create({
        data: {
          id: sessionId,
          teamId: state.teamId,
          state: JSON.parse(JSON.stringify(state)),
          sequence: state.history.length,
        },
      });
    }
  }

  private toPlainRecord(obj: unknown): Record<string, unknown> {
    if (obj === null || obj === undefined) return {};
    if (typeof obj !== 'object') return { value: obj };
    return JSON.parse(JSON.stringify(obj));
  }
}
