"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginSandbox = exports.PluginRegistry = exports.ExecutionContextImpl = exports.ENGINE_VERSION = exports.SDK_VERSION = void 0;
/**
 * Plugin SDK version
 */
exports.SDK_VERSION = '1.0.0';
exports.ENGINE_VERSION = '1.0.0';
/**
 * Execution context implementation
 */
class ExecutionContextImpl {
    _state;
    _answer;
    _photo = null;
    _location = null;
    _inventory = { items: [], capacity: 20 };
    _resources = {
        score: 0,
        reputation: 0,
        money: 0,
        energy: 100,
        lives: 3,
        penalty: 0,
        custom: {},
    };
    _items = [];
    _startTime;
    constructor(state, answer) {
        this._state = state;
        this._answer = answer;
        this._startTime = state?.startedAt || Date.now();
    }
    getState() {
        return this._state;
    }
    getTeam() {
        return this._state?.team || {};
    }
    getGame() {
        return this._state?.game || {};
    }
    getAnswer() {
        return this._answer;
    }
    setAnswer(answer) {
        this._answer = answer;
    }
    getPhoto() {
        return this._photo;
    }
    setPhoto(photo) {
        this._photo = photo;
    }
    getLocation() {
        return this._location;
    }
    setLocation(location) {
        this._location = location;
    }
    getInventory() {
        return this._inventory;
    }
    getResources() {
        return this._resources;
    }
    addItem(item) {
        this._items.push(item);
    }
    removeItem(itemId) {
        this._items = this._items.filter((i) => i.id !== itemId);
    }
    hasItem(itemId) {
        return this._items.some((i) => i.id === itemId);
    }
    setResource(name, value) {
        this._resources[name] = value;
    }
    getResource(name) {
        return this._resources[name] ?? 0;
    }
    addScore(amount) {
        this._resources.score += amount;
    }
    addPenalty(amount) {
        this._resources.penalty = (this._resources.penalty ?? 0) + amount;
    }
    getCurrentTime() {
        return Date.now();
    }
    getElapsedTime() {
        return Date.now() - this._startTime;
    }
    log(message, level = 'info') {
        const logger = new (require('@nestjs/common').Logger)('ExecutionContext');
        logger.log(message, level);
    }
    getRemainingTime() {
        const state = this._state;
        const timer = state?.currentNode?.timer || 0;
        const elapsed = this.getElapsedTime();
        return Math.max(0, timer * 1000 - elapsed);
    }
    getMaxIterations() {
        return 1000;
    }
}
exports.ExecutionContextImpl = ExecutionContextImpl;
/**
 * Plugin registry
 */
class PluginRegistry {
    plugins = new Map();
    register(plugin) {
        if (plugin.version !== exports.SDK_VERSION) {
            throw new Error(`Plugin version mismatch: ${plugin.version} != ${exports.SDK_VERSION}`);
        }
        if (this.plugins.has(plugin.type)) {
            throw new Error(`Plugin ${plugin.type} already registered`);
        }
        if (!plugin.schema) {
            throw new Error(`Plugin ${plugin.type} missing schema`);
        }
        this.plugins.set(plugin.type, plugin);
    }
    get(type) {
        return this.plugins.get(type);
    }
    getAll() {
        return Array.from(this.plugins.values());
    }
    has(type) {
        return this.plugins.has(type);
    }
}
exports.PluginRegistry = PluginRegistry;
/**
 * Plugin sandbox (timeout wrapper)
 */
class PluginSandbox {
    TIMEOUT_MS = 5000;
    async execute(plugin, config, context) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Plugin execution timeout (5s)')), this.TIMEOUT_MS);
        });
        const executionPromise = Promise.resolve(plugin.execute(config, context));
        return Promise.race([executionPromise, timeoutPromise]);
    }
}
exports.PluginSandbox = PluginSandbox;
//# sourceMappingURL=plugin-sdk.js.map