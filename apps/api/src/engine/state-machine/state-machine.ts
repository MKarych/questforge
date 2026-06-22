import {
  GameStatus,
  TeamStatus,
} from '../types/engine.types';

export interface Transition<T extends string> {
  from: T;
  to: T;
  trigger: string;
  actor: string;
  event: string;
}

export class StateMachine<T extends string> {
  private transitions: Map<string, Map<string, Transition<T>>> = new Map();

  addTransition(
    from: T,
    to: T,
    trigger: string,
    actor: string,
    event: string,
  ): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Map());
    }
    this.transitions.get(from)!.set(trigger, {
      from,
      to,
      trigger,
      actor,
      event,
    });
  }

  canTransition(from: T, trigger: string): boolean {
    return this.transitions.get(from)?.has(trigger) || false;
  }

  getTransition(from: T, trigger: string): Transition<T> | undefined {
    return this.transitions.get(from)?.get(trigger);
  }

  transition(from: T, trigger: string): T {
    const transition = this.getTransition(from, trigger);
    if (!transition) {
      throw new Error(
        `Invalid transition: ${from} -> (trigger: ${trigger}). Allowed triggers: ${this.getAllowedTriggers(from)}`,
      );
    }
    return transition.to;
  }

  getAllowedTransitions(from: T): Transition<T>[] {
    const map = this.transitions.get(from);
    return map ? Array.from(map.values()) : [];
  }

  getAllowedTriggers(from: T): string[] {
    const map = this.transitions.get(from);
    return map ? Array.from(map.keys()) : [];
  }
}

/**
 * Game State Machine
 * CREATED -> PUBLISHED -> WAITING_FOR_PLAYERS -> STARTED -> IN_PROGRESS -> FINISHED -> ARCHIVED
 * IN_PROGRESS <-> PAUSED
 */
export class GameStateMachine extends StateMachine<GameStatus> {
  constructor() {
    super();
    this.defineTransitions();
  }

  private defineTransitions(): void {
    // CREATED -> PUBLISHED
    this.addTransition(
      GameStatus.CREATED,
      GameStatus.PUBLISHED,
      'publish',
      'organizer',
      'GAME_PUBLISHED',
    );

    // PUBLISHED -> WAITING_FOR_PLAYERS
    this.addTransition(
      GameStatus.PUBLISHED,
      GameStatus.WAITING_FOR_PLAYERS,
      'openRegistration',
      'organizer',
      'REGISTRATION_OPENED',
    );

    // WAITING_FOR_PLAYERS -> STARTED
    this.addTransition(
      GameStatus.WAITING_FOR_PLAYERS,
      GameStatus.STARTED,
      'start',
      'organizer',
      'GAME_STARTED',
    );

    // STARTED -> IN_PROGRESS
    this.addTransition(
      GameStatus.STARTED,
      GameStatus.IN_PROGRESS,
      'assignFirstNode',
      'engine',
      'NODE_ASSIGNED',
    );

    // IN_PROGRESS <-> PAUSED
    this.addTransition(
      GameStatus.IN_PROGRESS,
      GameStatus.PAUSED,
      'pause',
      'organizer',
      'GAME_PAUSED',
    );

    this.addTransition(
      GameStatus.PAUSED,
      GameStatus.IN_PROGRESS,
      'resume',
      'organizer',
      'GAME_RESUMED',
    );

    // IN_PROGRESS -> FINISHED
    this.addTransition(
      GameStatus.IN_PROGRESS,
      GameStatus.FINISHED,
      'finish',
      'engine',
      'GAME_FINISHED',
    );

    // FINISHED -> ARCHIVED
    this.addTransition(
      GameStatus.FINISHED,
      GameStatus.ARCHIVED,
      'archive',
      'admin',
      'GAME_ARCHIVED',
    );
  }
}

/**
 * Team State Machine
 * REGISTERED -> ACTIVE -> WAITING_ANSWER -> NODE_COMPLETED -> NEXT_NODE -> WAITING_ANSWER (loop)
 * WAITING_ANSWER -> NODE_FAILED -> WAITING_ANSWER (retry loop)
 * WAITING_ANSWER -> FINISHED
 */
export class TeamStateMachine extends StateMachine<TeamStatus> {
  constructor() {
    super();
    this.defineTransitions();
  }

  private defineTransitions(): void {
    // REGISTERED -> ACTIVE
    this.addTransition(
      TeamStatus.REGISTERED,
      TeamStatus.ACTIVE,
      'gameStart',
      'engine',
      'TEAM_ACTIVATED',
    );

    // ACTIVE -> WAITING_ANSWER
    this.addTransition(
      TeamStatus.ACTIVE,
      TeamStatus.WAITING_ANSWER,
      'assignNode',
      'engine',
      'NODE_ASSIGNED',
    );

    // WAITING_ANSWER -> NODE_COMPLETED
    this.addTransition(
      TeamStatus.WAITING_ANSWER,
      TeamStatus.NODE_COMPLETED,
      'answerAccepted',
      'engine',
      'ANSWER_ACCEPTED',
    );

    // NODE_COMPLETED -> NEXT_NODE
    this.addTransition(
      TeamStatus.NODE_COMPLETED,
      TeamStatus.NEXT_NODE,
      'transition',
      'engine',
      'NODE_COMPLETED',
    );

    // NEXT_NODE -> WAITING_ANSWER
    this.addTransition(
      TeamStatus.NEXT_NODE,
      TeamStatus.WAITING_ANSWER,
      'assignNode',
      'engine',
      'NODE_ASSIGNED',
    );

    // WAITING_ANSWER -> NODE_FAILED
    this.addTransition(
      TeamStatus.WAITING_ANSWER,
      TeamStatus.NODE_FAILED,
      'answerRejected',
      'engine',
      'ANSWER_REJECTED',
    );

    // NODE_FAILED -> WAITING_ANSWER (retry)
    this.addTransition(
      TeamStatus.NODE_FAILED,
      TeamStatus.WAITING_ANSWER,
      'retry',
      'engine',
      'NODE_RETRY',
    );

    // WAITING_ANSWER -> FINISHED (last node)
    this.addTransition(
      TeamStatus.WAITING_ANSWER,
      TeamStatus.FINISHED,
      'gameFinish',
      'engine',
      'TEAM_FINISHED',
    );
  }
}
