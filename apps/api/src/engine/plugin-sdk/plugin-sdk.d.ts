/**
 * Plugin SDK version
 */
export declare const SDK_VERSION = "1.0.0";
export declare const ENGINE_VERSION = "1.0.0";
/**
 * Plugin manifest
 */
export interface PluginManifest {
    type: string;
    name: string;
    version: string;
    engineVersion: string;
    author: string;
    description: string;
    icon: string;
}
/**
 * Plugin interface
 */
export interface MissionPlugin {
    readonly type: string;
    readonly name: string;
    readonly description: string;
    readonly icon: string;
    readonly version: string;
    readonly author: string;
    readonly schema: Record<string, unknown>;
    validate(config: unknown): Promise<ValidationResult>;
    execute(config: unknown, context: ExecutionContext): Promise<MissionResult>;
    serialize(config: unknown): Record<string, unknown>;
    deserialize(data: Record<string, unknown>): unknown;
}
/**
 * Execution context
 */
export interface ExecutionContext {
    getState(): Record<string, unknown>;
    getTeam(): Record<string, unknown>;
    getGame(): Record<string, unknown>;
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
export interface Location {
    lat: number;
    lng: number;
    accuracy?: number;
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
    penalty: number;
    custom: Record<string, number>;
}
/**
 * Execution result
 */
export interface MissionResult {
    success: boolean;
    score: number;
    reason?: string;
    next?: string;
    items?: Item[];
    events?: Record<string, unknown>[];
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
}
/**
 * Log levels
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
/**
 * Execution context implementation
 */
export declare class ExecutionContextImpl implements ExecutionContext {
    private _state;
    private _answer;
    private _photo;
    private _location;
    private _inventory;
    private _resources;
    private _items;
    private _startTime;
    constructor(state: Record<string, unknown>, answer: string);
    getState(): Record<string, unknown>;
    getTeam(): Record<string, unknown>;
    getGame(): Record<string, unknown>;
    getAnswer(): string | null;
    setAnswer(answer: string): void;
    getPhoto(): string | null;
    setPhoto(photo: string): void;
    getLocation(): Location | null;
    setLocation(location: Location): void;
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
/**
 * Plugin registry
 */
export declare class PluginRegistry {
    private plugins;
    register(plugin: MissionPlugin): void;
    get(type: string): MissionPlugin | undefined;
    getAll(): MissionPlugin[];
    has(type: string): boolean;
}
/**
 * Plugin sandbox (timeout wrapper)
 */
export declare class PluginSandbox {
    private readonly TIMEOUT_MS;
    execute(plugin: MissionPlugin, config: unknown, context: ExecutionContext): Promise<MissionResult>;
}
//# sourceMappingURL=plugin-sdk.d.ts.map