"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EngineOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const engine_types_1 = require("../types/engine.types");
const event_store_1 = require("../event-store/event-store");
const state_machine_1 = require("../state-machine/state-machine");
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
const lock_manager_1 = require("../lock-manager/lock-manager");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let EngineOrchestrator = EngineOrchestrator_1 = class EngineOrchestrator {
    eventStore;
    gameStateMachine;
    teamStateMachine;
    pluginRegistry;
    pluginSandbox;
    lockManager;
    prisma;
    logger = new common_1.Logger(EngineOrchestrator_1.name);
    constructor(eventStore, gameStateMachine, teamStateMachine, pluginRegistry, pluginSandbox, lockManager, prisma) {
        this.eventStore = eventStore;
        this.gameStateMachine = gameStateMachine;
        this.teamStateMachine = teamStateMachine;
        this.pluginRegistry = pluginRegistry;
        this.pluginSandbox = pluginSandbox;
        this.lockManager = lockManager;
        this.prisma = prisma;
    }
    // ==========================================================================
    // Public API
    // ==========================================================================
    /**
     * Process a player answer for a given node.
     */
    async processAnswer(sessionId, teamId, gameId, answer, nodeId) {
        // 1. Acquire distributed lock
        const acquired = await this.lockManager.acquire(sessionId);
        if (!acquired) {
            throw new common_1.BadRequestException('Session is being processed');
        }
        try {
            // 2. Load current session state
            const state = await this.loadSessionState(sessionId, teamId);
            if (!state) {
                throw new common_1.NotFoundException('Session not found');
            }
            // 3. Validate session is active
            this.validateSessionActive(state);
            // 4. Load and validate node
            const node = await this.loadNode(gameId, nodeId);
            if (!node) {
                throw new common_1.NotFoundException(`Node ${nodeId} not found in game scenario`);
            }
            // 5. Validate node belongs to current session
            if (nodeId !== state.currentNodeId) {
                throw new common_1.BadRequestException(`Answer is for node ${nodeId}, but current node is ${state.currentNodeId}`);
            }
            // 6. Find plugin for node type
            const plugin = this.pluginRegistry.get(node.type);
            if (!plugin) {
                throw new common_1.BadRequestException(`No plugin registered for node type: ${node.type}`);
            }
            // 7. Evaluate answer through plugin (Rules Engine)
            const pluginConfig = this.buildPluginConfig(node);
            const context = new plugin_sdk_1.ExecutionContextImpl(this.toPlainRecord(state), answer);
            const pluginResult = await this.pluginSandbox.execute(plugin, pluginConfig, context);
            // 8. Determine transition type
            const transitionType = pluginResult.success ? 'success' : 'fail';
            // 9. Generate events
            const events = this.generateEvents(sessionId, teamId, gameId, nodeId, answer, pluginResult, transitionType, state.history.length + 1);
            // 10. Resolve next node via transitions
            const nextNode = this.resolveNextNode(node, transitionType);
            // 11. Update state
            const newState = this.applyTransition(state, nodeId, transitionType, pluginResult, nextNode);
            // 12. Transition state machine
            this.transitionTeamState(newState, transitionType, nextNode);
            // 13. Save events and state snapshot
            await this.eventStore.appendMany(events);
            await this.saveStateSnapshot(sessionId, newState);
            this.logger.log(`Answer processed for session ${sessionId}: ${pluginResult.success ? 'accepted' : 'rejected'} — ${nodeId} -> ${nextNode?.id || 'FINISH'}`);
            return {
                success: pluginResult.success,
                state: newState,
                nextNode,
                events,
                message: pluginResult.success
                    ? 'Answer accepted'
                    : pluginResult.reason || 'Answer rejected',
                transitionType,
            };
        }
        finally {
            await this.lockManager.release(sessionId);
        }
    }
    /**
     * Start a new session for a team.
     */
    async startSession(teamId, gameId, teamName, startNodeId) {
        // Verify game exists and start node exists
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { scenario: true },
        });
        if (!game) {
            throw new common_1.NotFoundException(`Game ${gameId} not found`);
        }
        if (!game.scenario) {
            throw new common_1.BadRequestException(`Game ${gameId} has no scenario`);
        }
        const nodes = this.parseNodes(game.scenario.nodes);
        const startNode = nodes.find((n) => n.id === startNodeId);
        if (!startNode) {
            throw new common_1.BadRequestException(`Start node ${startNodeId} not found in scenario`);
        }
        // Create initial state
        const state = {
            sessionId: (0, uuid_1.v4)(),
            teamId,
            teamName,
            gameId,
            currentNodeId: startNodeId,
            score: 0,
            penalties: 0,
            status: engine_types_1.TeamStatus.WAITING_ANSWER,
            startedAt: Date.now(),
            history: [],
        };
        // Generate session events
        const events = [
            {
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.SESSION_CREATE,
                gameId,
                teamId,
                payload: { teamName },
                timestamp: Date.now(),
                sequence: 1,
                version: 1,
            },
            {
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.NODE_ENTER,
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
    async getCurrentNode(sessionId, teamId) {
        const state = await this.loadSessionState(sessionId, teamId);
        if (!state)
            return null;
        // Load game to get scenario nodes
        const game = await this.prisma.game.findUnique({
            where: { id: state.gameId },
            include: { scenario: true },
        });
        if (!game?.scenario)
            return null;
        const nodes = this.parseNodes(game.scenario.nodes);
        const currentNode = nodes.find((n) => n.id === state.currentNodeId);
        if (!currentNode)
            return null;
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
    async getSessionHistory(sessionId, teamId) {
        return this.loadSessionState(sessionId, teamId);
    }
    /**
     * Get available transitions for current node.
     */
    async getAvailableTransitions(sessionId, teamId) {
        const state = await this.loadSessionState(sessionId, teamId);
        if (!state)
            return [];
        const game = await this.prisma.game.findUnique({
            where: { id: state.gameId },
            include: { scenario: true },
        });
        if (!game?.scenario)
            return [];
        const nodes = this.parseNodes(game.scenario.nodes);
        const currentNode = nodes.find((n) => n.id === state.currentNodeId);
        if (!currentNode)
            return [];
        return currentNode.transitions.map((t) => t.when);
    }
    // ==========================================================================
    // Plugin config builders for each node type
    // ==========================================================================
    buildPluginConfig(node) {
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
    validateSessionActive(state) {
        if (state.status === engine_types_1.TeamStatus.FINISHED) {
            throw new common_1.BadRequestException('Session has already finished');
        }
        if (state.status === engine_types_1.TeamStatus.NODE_COMPLETED) {
            throw new common_1.BadRequestException('Node already completed — waiting for transition');
        }
    }
    async loadSessionState(sessionId, teamId) {
        // Try to load from database snapshot by teamId (most recent)
        const snapshot = await this.prisma.sessionState.findFirst({
            where: { teamId },
            orderBy: { sequence: 'desc' },
        });
        if (snapshot) {
            return snapshot.state;
        }
        return null;
    }
    async loadNode(gameId, nodeId) {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { scenario: true },
        });
        if (!game?.scenario)
            return null;
        const nodes = this.parseNodes(game.scenario.nodes);
        return nodes.find((n) => n.id === nodeId) || null;
    }
    parseNodes(nodes) {
        if (!nodes)
            return [];
        if (Array.isArray(nodes))
            return nodes;
        if (typeof nodes === 'string') {
            try {
                return JSON.parse(nodes);
            }
            catch {
                return [];
            }
        }
        if (typeof nodes === 'object') {
            const obj = nodes;
            return Array.isArray(obj.nodes)
                ? obj.nodes
                : obj;
        }
        return [];
    }
    /**
     * Resolve the next node using transitions array (not hardcoded nextNodeId).
     */
    resolveNextNode(currentNode, transitionType) {
        // 1. Try to find exact transition
        const transition = currentNode.transitions.find((t) => t.when === transitionType);
        if (transition?.to) {
            return {
                id: transition.to,
                type: 'text', // placeholder — actual type loaded when needed
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
     */
    applyTransition(state, currentNodeId, transitionType, pluginResult, nextNode) {
        const scoreDelta = pluginResult.success ? (pluginResult.score || 10) : 0;
        const penaltyDelta = pluginResult.success ? 0 : 1;
        return {
            ...state,
            score: state.score + scoreDelta,
            penalties: state.penalties + penaltyDelta,
            history: [
                ...state.history,
                {
                    nodeId: currentNodeId,
                    result: transitionType === 'success' ? 'success' : 'fail',
                    timestamp: Date.now(),
                    score: scoreDelta,
                },
            ],
            currentNodeId: nextNode?.id || state.currentNodeId,
            status: nextNode
                ? engine_types_1.TeamStatus.WAITING_ANSWER
                : engine_types_1.TeamStatus.FINISHED,
            finishedAt: nextNode ? undefined : Date.now(),
        };
    }
    /**
     * Transition team state machine based on the answer result.
     */
    transitionTeamState(state, transitionType, nextNode) {
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
        }
        else {
            // No next node — game finished
            if (this.teamStateMachine.canTransition(state.status, 'gameFinish')) {
                this.teamStateMachine.transition(state.status, 'gameFinish');
            }
        }
    }
    /**
     * Generate events for the answer processing.
     */
    generateEvents(sessionId, teamId, gameId, nodeId, answer, pluginResult, transitionType, startSequence) {
        const events = [];
        let seq = startSequence;
        // 1. Player answer submitted
        events.push({
            id: (0, uuid_1.v4)(),
            type: engine_types_1.EventType.PLAYER_ANSWER,
            gameId,
            teamId,
            nodeId,
            payload: { answer },
            timestamp: Date.now(),
            sequence: seq++,
            version: 1,
        });
        // 2. Answer accepted or rejected
        if (pluginResult.success) {
            events.push({
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.ANSWER_ACCEPTED,
                gameId,
                teamId,
                nodeId,
                payload: { score: pluginResult.score || 10, answer },
                timestamp: Date.now(),
                sequence: seq++,
                version: 1,
            });
            events.push({
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.NODE_COMPLETED,
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
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.SCORE_UPDATE,
                gameId,
                teamId,
                nodeId,
                payload: { delta: pluginResult.score || 10, reason: 'correct_answer' },
                timestamp: Date.now(),
                sequence: seq++,
                version: 1,
            });
        }
        else {
            events.push({
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.ANSWER_REJECTED,
                gameId,
                teamId,
                nodeId,
                payload: { reason: pluginResult.reason || 'incorrect', answer },
                timestamp: Date.now(),
                sequence: seq++,
                version: 1,
            });
            events.push({
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.NODE_FAILED,
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
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.PENALTY_APPLIED,
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
                id: (0, uuid_1.v4)(),
                type: engine_types_1.EventType.NODE_ENTER,
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
            id: (0, uuid_1.v4)(),
            type: engine_types_1.EventType.STATE_SYNC,
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
    async saveStateSnapshot(sessionId, state) {
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
        }
        else {
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
    toPlainRecord(obj) {
        if (obj === null || obj === undefined)
            return {};
        if (typeof obj !== 'object')
            return { value: obj };
        return JSON.parse(JSON.stringify(obj));
    }
};
exports.EngineOrchestrator = EngineOrchestrator;
exports.EngineOrchestrator = EngineOrchestrator = EngineOrchestrator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_store_1.EventStore,
        state_machine_1.GameStateMachine,
        state_machine_1.TeamStateMachine,
        plugin_sdk_1.PluginRegistry,
        plugin_sdk_1.PluginSandbox,
        lock_manager_1.LockManager,
        prisma_service_1.PrismaService])
], EngineOrchestrator);
//# sourceMappingURL=engine-orchestrator.js.map