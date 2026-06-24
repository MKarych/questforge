import { GameStatus, TeamStatus } from '../types/engine.types';
export interface Transition<T extends string> {
    from: T;
    to: T;
    trigger: string;
    actor: string;
    event: string;
}
export declare class StateMachine<T extends string> {
    private transitions;
    addTransition(from: T, to: T, trigger: string, actor: string, event: string): void;
    canTransition(from: T, trigger: string): boolean;
    getTransition(from: T, trigger: string): Transition<T> | undefined;
    transition(from: T, trigger: string): T;
    getAllowedTransitions(from: T): Transition<T>[];
    getAllowedTriggers(from: T): string[];
}
/**
 * Game State Machine
 * CREATED -> PUBLISHED -> WAITING_FOR_PLAYERS -> STARTED -> IN_PROGRESS -> FINISHED -> ARCHIVED
 * IN_PROGRESS <-> PAUSED
 */
export declare class GameStateMachine extends StateMachine<GameStatus> {
    constructor();
    private defineTransitions;
}
/**
 * Team State Machine
 * REGISTERED -> ACTIVE -> WAITING_ANSWER -> NODE_COMPLETED -> NEXT_NODE -> WAITING_ANSWER (loop)
 * WAITING_ANSWER -> NODE_FAILED -> WAITING_ANSWER (retry loop)
 * WAITING_ANSWER -> FINISHED
 */
export declare class TeamStateMachine extends StateMachine<TeamStatus> {
    constructor();
    private defineTransitions;
}
//# sourceMappingURL=state-machine.d.ts.map