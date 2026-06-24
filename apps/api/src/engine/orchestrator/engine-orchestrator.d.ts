import { Event, SessionState, ScenarioNode, NodeType, TransitionType } from '../types/engine.types';
import { EventStore } from '../event-store/event-store';
import { GameStateMachine, TeamStateMachine } from '../state-machine/state-machine';
import { PluginRegistry, PluginSandbox } from '../plugin-sdk/plugin-sdk';
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
export declare class EngineOrchestrator {
    private readonly eventStore;
    private readonly gameStateMachine;
    private readonly teamStateMachine;
    private readonly pluginRegistry;
    private readonly pluginSandbox;
    private readonly lockManager;
    private readonly prisma;
    private readonly logger;
    constructor(eventStore: EventStore, gameStateMachine: GameStateMachine, teamStateMachine: TeamStateMachine, pluginRegistry: PluginRegistry, pluginSandbox: PluginSandbox, lockManager: LockManager, prisma: PrismaService);
    /**
     * Process a player answer for a given node.
     */
    processAnswer(sessionId: string, teamId: string, gameId: string, answer: string, nodeId: string): Promise<ProcessAnswerResult>;
    /**
     * Start a new session for a team.
     */
    startSession(teamId: string, gameId: string, teamName: string, startNodeId: string): Promise<SessionState>;
    /**
     * Get current node info for a session.
     */
    getCurrentNode(sessionId: string, teamId: string): Promise<CurrentNodeInfo | null>;
    /**
     * Get session history.
     */
    getSessionHistory(sessionId: string, teamId: string): Promise<SessionState | null>;
    /**
     * Get available transitions for current node.
     */
    getAvailableTransitions(sessionId: string, teamId: string): Promise<string[]>;
    private buildPluginConfig;
    private validateSessionActive;
    private loadSessionState;
    private loadNode;
    private parseNodes;
    /**
     * Resolve the next node using transitions array (not hardcoded nextNodeId).
     */
    private resolveNextNode;
    /**
     * Apply state transition: update score, penalties, history, currentNodeId.
     */
    private applyTransition;
    /**
     * Transition team state machine based on the answer result.
     */
    private transitionTeamState;
    /**
     * Generate events for the answer processing.
     */
    private generateEvents;
    private saveStateSnapshot;
    private toPlainRecord;
}
//# sourceMappingURL=engine-orchestrator.d.ts.map