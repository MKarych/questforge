/**
 * Plugin SDK version
 */
export const SDK_VERSION = '1.0.0';
export const ENGINE_VERSION = '1.0.0';

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
export class ExecutionContextImpl implements ExecutionContext {
  private _state: Record<string, unknown>;
  private _answer: string | null;
  private _photo: string | null = null;
  private _location: Location | null = null;
  private _inventory: Inventory = { items: [], capacity: 20 };
  private _resources: Resources = {
    score: 0,
    reputation: 0,
    money: 0,
    energy: 100,
    lives: 3,
    penalty: 0,
    custom: {},
  };
  private _items: Item[] = [];
  private _startTime: number;

  constructor(state: Record<string, unknown>, answer: string) {
    this._state = state;
    this._answer = answer;
    this._startTime = (state as any)?.startedAt || Date.now();
  }

  getState(): Record<string, unknown> {
    return this._state;
  }

  getTeam(): Record<string, unknown> {
    return (this._state as any)?.team || {};
  }

  getGame(): Record<string, unknown> {
    return (this._state as any)?.game || {};
  }

  getAnswer(): string | null {
    return this._answer;
  }

  setAnswer(answer: string): void {
    this._answer = answer;
  }

  getPhoto(): string | null {
    return this._photo;
  }

  setPhoto(photo: string): void {
    this._photo = photo;
  }

  getLocation(): Location | null {
    return this._location;
  }

  setLocation(location: Location): void {
    this._location = location;
  }

  getInventory(): Inventory {
    return this._inventory;
  }

  getResources(): Resources {
    return this._resources;
  }

  addItem(item: Item): void {
    this._items.push(item);
  }

  removeItem(itemId: string): void {
    this._items = this._items.filter((i) => i.id !== itemId);
  }

  hasItem(itemId: string): boolean {
    return this._items.some((i) => i.id === itemId);
  }

  setResource(name: string, value: number): void {
    (this._resources as any)[name] = value;
  }

  getResource(name: string): number {
    return (this._resources as any)[name] ?? 0;
  }

  addScore(amount: number): void {
    this._resources.score += amount;
  }

  addPenalty(amount: number): void {
    this._resources.penalty = (this._resources.penalty ?? 0) + amount;
  }

  getCurrentTime(): number {
    return Date.now();
  }

  getElapsedTime(): number {
    return Date.now() - this._startTime;
  }

  log(message: string, level: LogLevel = 'info'): void {
    const logger = new (require('@nestjs/common').Logger)(
      'ExecutionContext',
    );
    logger.log(message, level);
  }

  getRemainingTime(): number {
    const state = this._state as any;
    const timer = state?.currentNode?.timer || 0;
    const elapsed = this.getElapsedTime();
    return Math.max(0, timer * 1000 - elapsed);
  }

  getMaxIterations(): number {
    return 1000;
  }
}

/**
 * Plugin registry
 */
export class PluginRegistry {
  private plugins = new Map<string, MissionPlugin>();

  register(plugin: MissionPlugin): void {
    if (plugin.version !== SDK_VERSION) {
      throw new Error(
        `Plugin version mismatch: ${plugin.version} != ${SDK_VERSION}`,
      );
    }
    if (this.plugins.has(plugin.type)) {
      throw new Error(`Plugin ${plugin.type} already registered`);
    }
    if (!plugin.schema) {
      throw new Error(`Plugin ${plugin.type} missing schema`);
    }
    this.plugins.set(plugin.type, plugin);
  }

  get(type: string): MissionPlugin | undefined {
    return this.plugins.get(type);
  }

  getAll(): MissionPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(type: string): boolean {
    return this.plugins.has(type);
  }
}

/**
 * Plugin sandbox (timeout wrapper)
 */
export class PluginSandbox {
  private readonly TIMEOUT_MS = 5000;

  async execute(
    plugin: MissionPlugin,
    config: unknown,
    context: ExecutionContext,
  ): Promise<MissionResult> {
    const timeoutPromise = new Promise<MissionResult>((_, reject) => {
      setTimeout(
        () => reject(new Error('Plugin execution timeout (5s)')),
        this.TIMEOUT_MS,
      );
    });

    const executionPromise = Promise.resolve(plugin.execute(config, context));

    return Promise.race([executionPromise, timeoutPromise]);
  }
}
