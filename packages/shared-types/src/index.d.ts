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
export type NodeType = 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'timer';
export type TransitionType = 'success' | 'fail' | 'timeout' | 'condition' | 'random';
export interface Scenario {
    id: string;
    version: string;
    name: string;
    nodes: ScenarioNode[];
    startNodeId: string;
}
export interface SessionState {
    sessionId: string;
    teamId: string;
    teamName: string;
    currentNodeId: string;
    score: number;
    penalties: number;
    status: 'active' | 'paused' | 'finished';
    startedAt: number;
    finishedAt?: number;
    history: EventLogEntry[];
}
export interface EventLogEntry {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: number;
    score?: number;
}
export type CommandType = 'SESSION_CREATE' | 'PLAYER_JOIN' | 'PLAYER_ANSWER' | 'PLAYER_LEAVE' | 'HINT_REQUEST' | 'SOS_SEND';
export type EventType = 'SESSION_CREATED' | 'GAME_START' | 'GAME_FINISH' | 'NODE_ENTER' | 'NODE_EXIT' | 'SCORE_UPDATE' | 'PENALTY_APPLIED' | 'HINT_REVEALED' | 'STATE_SYNC' | 'TIMER_START' | 'TIMER_END' | 'ERROR_OCCURRED' | 'LEADERBOARD_UPDATE';
export interface BaseEvent {
    id: string;
    type: EventType;
    sessionId: string;
    timestamp: number;
    version: number;
    payload: Record<string, unknown>;
}
export interface PlayerAnswerPayload {
    playerId: string;
    nodeId: string;
    answer: string | number | boolean;
    answerType: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice';
    metadata?: {
        lat?: number;
        lng?: number;
        photoUrl?: string;
        accuracy?: number;
    };
}
export interface NodeExitPayload {
    nodeId: string;
    result: 'success' | 'fail' | 'timeout' | 'pending';
    score: number;
    penalties: number;
    nextNodeId?: string | null;
}
export interface ScoreUpdatePayload {
    score: number;
    delta: number;
    source: 'answer' | 'bonus' | 'penalty' | 'timeout';
    totalPenalties: number;
}
export interface StateSyncPayload {
    sessionId: string;
    currentNodeId: string;
    score: number;
    penalties: number;
    status: 'active' | 'paused' | 'finished';
    history: Array<{
        nodeId: string;
        result: 'success' | 'fail' | 'timeout';
        timestamp: number;
    }>;
    startedAt: number;
    finishedAt?: number;
}
export interface MissionPlugin {
    readonly type: string;
    readonly name: string;
    readonly description: string;
    readonly icon: string;
    readonly version: string;
    readonly author: string;
    readonly schema: JSONSchema;
    validate(config: unknown): Promise<ValidationResult>;
    execute(config: unknown, context: ExecutionContext): Promise<MissionResult>;
    serialize(config: unknown): JsonObject;
    deserialize(data: JsonObject): unknown;
}
export interface ExecutionContext {
    getState(): SessionState;
    getTeam(): Team;
    getGame(): Game;
    getAnswer(): string | null;
    getPhoto(): string | null;
    getLocation(): Location | null;
    getInventory(): Inventory;
    getResources(): Resources;
    addItem(item: Item): void;
    removeItem(itemId: string): void;
    hasItem(itemId: string): boolean;
    setResource(name: string, value: number): void;
    getResource(name: string): number;
    addScore(amount: number): void;
    addPenalty(amount: number): void;
    getCurrentTime(): number;
    getElapsedTime(): number;
    log(message: string, level?: LogLevel): void;
    getRemainingTime(): number;
    getMaxIterations(): number;
}
export interface MissionResult {
    success: boolean;
    score: number;
    reason?: string;
    next?: string;
    items?: Item[];
    events?: Event[];
}
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
}
export type GameStatus = 'CREATED' | 'PUBLISHED' | 'WAITING_FOR_PLAYERS' | 'STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';
export type TeamStatus = 'REGISTERED' | 'ACTIVE' | 'WAITING_ANSWER' | 'NODE_COMPLETED' | 'NODE_FAILED' | 'NEXT_NODE' | 'FINISHED';
export type UserRole = 'PLAYER' | 'ORGANIZER' | 'ADMIN' | 'MODERATOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export interface Team {
    id: string;
    name: string;
    gameId: string;
    captainId: string;
    currentNodeId?: string;
    score: number;
    penalties: number;
    status: TeamStatus;
    startedAt: Date;
    finishedAt?: Date;
    lastActivityAt: Date;
}
export interface Game {
    id: string;
    title: string;
    description?: string;
    city: string;
    date: Date;
    duration: number;
    price: number;
    maxTeams: number;
    shareLink: string;
    status: GameStatus;
    moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    organizerId: string;
    scenarioId?: string;
    imageUrl?: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface SocialLinks {
    tg?: string;
    vk?: string;
    discord?: string;
    youtube?: string;
    github?: string;
}
export interface Favorites {
    games: string[];
    scenarios: string[];
    authors: string[];
}
export interface UserProfile {
    avatar: string | null;
    bio: string;
    city: string;
    socialLinks: SocialLinks;
    favorites: Favorites;
    lastSeenAt: Date | null;
    metadata: Record<string, unknown>;
}
export interface NotificationSettings {
    email: boolean;
    telegram: boolean;
    push: boolean;
}
export interface PrivacySettings {
    showCity: 'everyone' | 'friends' | 'nobody';
    showContacts: 'everyone' | 'friends' | 'nobody';
    showStats: 'everyone' | 'friends' | 'nobody';
    showAchievements: 'everyone' | 'friends' | 'nobody';
}
export interface UserSettings {
    language: 'ru' | 'en';
    timezone: string;
    theme: 'dark' | 'light';
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}
export interface UserSecurity {
    lastLoginAt: Date | null;
    failedLoginAttempts: number;
    passwordChangedAt: Date | null;
    trustedDevices: Device[];
}
export interface Device {
    id: string;
    name: string;
    lastIp: string;
    lastUsedAt: Date;
    trusted: boolean;
}
export interface UserReputation {
    rating: number;
    trustScore: number;
    reviewsCount: number;
    violations: number;
    completedGames: number;
    achievements: Achievement[];
}
export interface Achievement {
    id: string;
    type: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
}
export interface AIProfile {
    preferences: AIPreferences;
    memory: AIMemory;
    history: AIHistory;
    context: AIContext;
    embeddings: number[];
}
export interface AIPreferences {
    genres: string[];
    averageTeamSize: number;
    averageGameDuration: number;
    favoriteDifficulty: 'easy' | 'medium' | 'hard';
}
export interface AIMemory {
    knownFacts: string[];
    lastConversation: string;
    memoryVersion: number;
}
export interface AIHistory {
    recommendedScenarios: string[];
    previousActions: string[];
    feedback: string[];
}
export interface AIContext {
    lastAgentAction: string;
    activeGoals: string[];
    personality: string;
}
export declare enum Capability {
    HOST_EVENTS = "HOST_EVENTS",
    CREATE_SCENARIOS = "CREATE_SCENARIOS",
    SELL_SCENARIOS = "SELL_SCENARIOS",
    CREATE_TEAM = "CREATE_TEAM",
    STREAM_GAME = "STREAM_GAME",
    MODERATE_CONTENT = "MODERATE_CONTENT"
}
export interface FeatureFlags {
    aiBeta: boolean;
    marketplace: boolean;
    premium: boolean;
    experimentalUI: boolean;
}
export interface PublicUser {
    uuid: string;
    username: string;
    slug: string;
    avatar: string | null;
    bio: string;
    city: string;
    rating: number;
    trustScore: number;
    achievements: Achievement[];
    gamesPlayed: number;
    gamesCreated: number;
    gamesConducted: number;
    scenariosCreated: number;
    reviewsCount: number;
    followersCount: number;
    followingCount: number;
    lastSeenAt: Date | null;
    createdAt: Date;
}
export interface PrivateUser extends PublicUser {
    email: string;
    roles: UserRole[];
    status: UserStatus;
    verified: Record<string, boolean>;
    version: number;
    language: string;
    timezone: string;
    theme: string;
    notificationSettings: NotificationSettings;
    privacySettings: PrivacySettings;
    socialLinks: SocialLinks;
    favorites: Favorites;
    lastLoginAt: Date | null;
    failedLoginAttempts: number;
    passwordChangedAt: Date | null;
    trustedDevices: Device[];
    featureFlags: FeatureFlags;
    metadata: Record<string, unknown>;
    aiProfile: AIProfile;
}
export interface AdminUser extends PrivateUser {
    capabilities: Capability[];
    violations: number;
    deletedAt: Date | null;
    auditLog: unknown[];
}
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: UserRole;
    status: UserStatus;
    contacts: Record<string, unknown>;
    organizerStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export interface Inventory {
    items: Item[];
    capacity: number;
}
export interface Item {
    id: string;
    name: string;
    description?: string;
    quantity: number;
}
export interface Resources {
    score: number;
    reputation: number;
    money: number;
    energy: number;
    lives: number;
    custom: Record<string, number>;
}
export interface Location {
    lat: number;
    lng: number;
    accuracy?: number;
}
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type JSONSchema = Record<string, unknown>;
export type JsonObject = Record<string, unknown>;
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        timestamp: number;
        version: string;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;
export declare enum ErrorCode {
    AUTH_REQUIRED = "AUTH_REQUIRED",
    AUTH_EXPIRED = "AUTH_EXPIRED",
    AUTH_INVALID = "AUTH_INVALID",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    CONFLICT = "CONFLICT",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    SESSION_LOCKED = "SESSION_LOCKED",
    INVALID_ANSWER = "INVALID_ANSWER",
    NODE_NOT_FOUND = "NODE_NOT_FOUND",
    GAME_NOT_ACTIVE = "GAME_NOT_ACTIVE",
    RATE_LIMIT = "RATE_LIMIT",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
//# sourceMappingURL=index.d.ts.map