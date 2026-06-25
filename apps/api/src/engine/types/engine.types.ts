/**
 * Event types registry — must match Prisma schema EventType enum
 */
export enum EventType {
  // Game events (must match Prisma schema)
  SESSION_CREATE = 'SESSION_CREATE',
  SESSION_CREATED = 'SESSION_CREATED',
  PLAYER_JOIN = 'PLAYER_JOIN',
  PLAYER_ANSWER = 'PLAYER_ANSWER',
  PLAYER_LEAVE = 'PLAYER_LEAVE',
  HINT_REQUEST = 'HINT_REQUEST',
  SOS_SEND = 'SOS_SEND',
  GAME_START = 'GAME_START',
  GAME_FINISH = 'GAME_FINISH',
  NODE_ENTER = 'NODE_ENTER',
  NODE_EXIT = 'NODE_EXIT',
  SCORE_UPDATE = 'SCORE_UPDATE',
  PENALTY_APPLIED = 'PENALTY_APPLIED',
  HINT_REVEALED = 'HINT_REVEALED',
  STATE_SYNC = 'STATE_SYNC',
  TIMER_START = 'TIMER_START',
  TIMER_END = 'TIMER_END',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  LEADERBOARD_UPDATE = 'LEADERBOARD_UPDATE',

  // Internal engine events (backward compat aliases)
  GAME_CREATED = 'GAME_CREATED',
  GAME_PUBLISHED = 'GAME_PUBLISHED',
  GAME_STARTED = 'GAME_STARTED',
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_FINISHED = 'GAME_FINISHED',
  TEAM_REGISTERED = 'TEAM_REGISTERED',
  NODE_ASSIGNED = 'NODE_ASSIGNED',
  ANSWER_SUBMITTED = 'ANSWER_SUBMITTED',
  ANSWER_ACCEPTED = 'ANSWER_ACCEPTED',
  ANSWER_REJECTED = 'ANSWER_REJECTED',
  HINT_REQUESTED = 'HINT_REQUESTED',
  HINT_SENT = 'HINT_SENT',
  NODE_COMPLETED = 'NODE_COMPLETED',
  NODE_FAILED = 'NODE_FAILED',
  TEAM_FINISHED = 'TEAM_FINISHED',
  TIME_TRAVEL = 'TIME_TRAVEL',
  NODE_SKIPPED = 'NODE_SKIPPED',
  ANSWER_OVERRIDDEN = 'ANSWER_OVERRIDDEN',
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
export enum GameStatus {
  CREATED = 'CREATED',
  PUBLISHED = 'PUBLISHED',
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TeamStatus {
  REGISTERED = 'REGISTERED',
  ACTIVE = 'ACTIVE',
  WAITING_ANSWER = 'WAITING_ANSWER',
  NODE_COMPLETED = 'NODE_COMPLETED',
  NODE_FAILED = 'NODE_FAILED',
  NEXT_NODE = 'NEXT_NODE',
  FINISHED = 'FINISHED',
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
  stateVersion: number; // optimistic locking — увеличивается при каждом изменении
  startedAt: number;
  finishedAt?: number;
  history: SessionHistoryEntry[];
}

export interface SessionHistoryEntry {
  nodeId: string;
  result: 'success' | 'fail' | 'timeout';
  timestamp: number;
  score?: number;
  actorUserId?: string; // кто именно сделал действие
}

/**
 * Answer command with stateVersion for conflict resolution
 */
export interface AnswerCommand {
  commandId: string;
  teamId: string;
  nodeId: string;
  stateVersion: number; // ключевое поле для optimistic locking
  answer: string;
  userId: string;
}

/**
 * Answer result with conflict resolution status
 */
export interface AnswerResult {
  status: 'accepted' | 'ignored' | 'stale';
  reason?: 'NODE_ALREADY_RESOLVED' | 'STATE_VERSION_MISMATCH';
  nodeId: string;
  currentVersion?: number;
}

/**
 * Hint request
 */
export interface HintRequest {
  nodeId: string;
  teamId: string;
  userId: string;
}

/**
 * Hint response
 */
export interface HintResponse {
  hint: string;
  penalty: number;
  alreadyRevealed: boolean;
}

/**
 * Team presence
 */
export interface Presence {
  userId: string;
  teamId: string;
  status: 'ONLINE' | 'OFFLINE' | 'IDLE';
  lastSeenAt: number;
  currentDevice: string;
}

/**
 * Team event with actor tracking
 */
export interface TeamEvent {
  id: string;
  type: 'ANSWER_SUBMITTED' | 'ANSWER_ACCEPTED' | 'ANSWER_REJECTED' | 'HINT_REQUESTED' | 'HINT_REVEALED';
  teamId: string;
  actorUserId: string; // КТО ИМЕННО сделал действие
  nodeId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * WebSocket realtime events
 */
export type RealtimeEventType =
  | 'STATE_SYNC'
  | 'NODE_ASSIGNED'
  | 'NODE_COMPLETED'
  | 'ANSWER_ACCEPTED'
  | 'ANSWER_REJECTED'
  | 'SCORE_UPDATED'
  | 'INVENTORY_UPDATED'
  | 'TEAM_FINISHED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'PRESENCE_UPDATE'
  | 'CHAT_MESSAGE'
  | 'HINT_REVEALED';

export interface RealtimeEvent {
  type: RealtimeEventType;
  teamId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
