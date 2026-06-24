/**
 * Event types registry — must match Prisma schema EventType enum
 */
export declare enum EventType {
    SESSION_CREATE = "SESSION_CREATE",
    SESSION_CREATED = "SESSION_CREATED",
    PLAYER_JOIN = "PLAYER_JOIN",
    PLAYER_ANSWER = "PLAYER_ANSWER",
    PLAYER_LEAVE = "PLAYER_LEAVE",
    HINT_REQUEST = "HINT_REQUEST",
    SOS_SEND = "SOS_SEND",
    GAME_START = "GAME_START",
    GAME_FINISH = "GAME_FINISH",
    NODE_ENTER = "NODE_ENTER",
    NODE_EXIT = "NODE_EXIT",
    SCORE_UPDATE = "SCORE_UPDATE",
    PENALTY_APPLIED = "PENALTY_APPLIED",
    HINT_REVEALED = "HINT_REVEALED",
    STATE_SYNC = "STATE_SYNC",
    TIMER_START = "TIMER_START",
    TIMER_END = "TIMER_END",
    ERROR_OCCURRED = "ERROR_OCCURRED",
    LEADERBOARD_UPDATE = "LEADERBOARD_UPDATE",
    GAME_CREATED = "GAME_CREATED",
    GAME_PUBLISHED = "GAME_PUBLISHED",
    GAME_STARTED = "GAME_STARTED",
    GAME_PAUSED = "GAME_PAUSED",
    GAME_RESUMED = "GAME_RESUMED",
    GAME_FINISHED = "GAME_FINISHED",
    TEAM_REGISTERED = "TEAM_REGISTERED",
    NODE_ASSIGNED = "NODE_ASSIGNED",
    ANSWER_SUBMITTED = "ANSWER_SUBMITTED",
    ANSWER_ACCEPTED = "ANSWER_ACCEPTED",
    ANSWER_REJECTED = "ANSWER_REJECTED",
    HINT_REQUESTED = "HINT_REQUESTED",
    HINT_SENT = "HINT_SENT",
    NODE_COMPLETED = "NODE_COMPLETED",
    NODE_FAILED = "NODE_FAILED",
    TEAM_FINISHED = "TEAM_FINISHED",
    TIME_TRAVEL = "TIME_TRAVEL",
    NODE_SKIPPED = "NODE_SKIPPED",
    ANSWER_OVERRIDDEN = "ANSWER_OVERRIDDEN"
}
/**
 * Base Event interface
 */
export interface Event {
    id: string;
    type: EventType;
    gameId: string;
    teamId?: string;
    nodeId?: string;
    payload: Record<string, unknown>;
    timestamp: number;
    sequence: number;
    version: number;
}
/**
 * Event Store interface
 */
export interface IEventStore {
    append(event: Event): Promise<void>;
    appendMany(events: Event[]): Promise<void>;
    getGameEvents(gameId: string): Promise<Event[]>;
    getTeamEvents(teamId: string): Promise<Event[]>;
    getEventsAfter(teamId: string, timestamp: number): Promise<Event[]>;
    isProcessed(eventId: string): Promise<boolean>;
    markProcessed(eventId: string): Promise<void>;
}
/**
 * State types
 */
export declare enum GameStatus {
    CREATED = "CREATED",
    PUBLISHED = "PUBLISHED",
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    STARTED = "STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    PAUSED = "PAUSED",
    FINISHED = "FINISHED",
    ARCHIVED = "ARCHIVED"
}
export declare enum TeamStatus {
    REGISTERED = "REGISTERED",
    ACTIVE = "ACTIVE",
    WAITING_ANSWER = "WAITING_ANSWER",
    NODE_COMPLETED = "NODE_COMPLETED",
    NODE_FAILED = "NODE_FAILED",
    NEXT_NODE = "NEXT_NODE",
    FINISHED = "FINISHED"
}
/**
 * Node types
 */
export type NodeType = 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'timer';
export type TransitionType = 'success' | 'fail' | 'timeout' | 'condition' | 'random';
export interface ScenarioNode {
    id: string;
    type: NodeType;
    question: string;
    answer?: string;
    transitions: Transition[];
    timer?: number;
    penalty?: number;
    hint?: string;
    mediaUrls?: string[];
    options?: string[];
    lat?: number;
    lng?: number;
    radius?: number;
}
export interface Transition {
    when: TransitionType;
    to: string;
    condition?: string;
}
/**
 * Session state
 */
export interface SessionState {
    sessionId: string;
    teamId: string;
    teamName: string;
    gameId: string;
    currentNodeId: string;
    score: number;
    penalties: number;
    status: TeamStatus;
    startedAt: number;
    finishedAt?: number;
    history: SessionHistoryEntry[];
}
export interface SessionHistoryEntry {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: number;
    score?: number;
}
//# sourceMappingURL=engine.types.d.ts.map