"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamStateMachine = exports.GameStateMachine = exports.StateMachine = void 0;
const engine_types_1 = require("../types/engine.types");
class StateMachine {
    transitions = new Map();
    addTransition(from, to, trigger, actor, event) {
        if (!this.transitions.has(from)) {
            this.transitions.set(from, new Map());
        }
        this.transitions.get(from).set(trigger, {
            from,
            to,
            trigger,
            actor,
            event,
        });
    }
    canTransition(from, trigger) {
        return this.transitions.get(from)?.has(trigger) || false;
    }
    getTransition(from, trigger) {
        return this.transitions.get(from)?.get(trigger);
    }
    transition(from, trigger) {
        const transition = this.getTransition(from, trigger);
        if (!transition) {
            throw new Error(`Invalid transition: ${from} -> (trigger: ${trigger}). Allowed triggers: ${this.getAllowedTriggers(from)}`);
        }
        return transition.to;
    }
    getAllowedTransitions(from) {
        const map = this.transitions.get(from);
        return map ? Array.from(map.values()) : [];
    }
    getAllowedTriggers(from) {
        const map = this.transitions.get(from);
        return map ? Array.from(map.keys()) : [];
    }
}
exports.StateMachine = StateMachine;
/**
 * Game State Machine
 * CREATED -> PUBLISHED -> WAITING_FOR_PLAYERS -> STARTED -> IN_PROGRESS -> FINISHED -> ARCHIVED
 * IN_PROGRESS <-> PAUSED
 */
class GameStateMachine extends StateMachine {
    constructor() {
        super();
        this.defineTransitions();
    }
    defineTransitions() {
        // CREATED -> PUBLISHED
        this.addTransition(engine_types_1.GameStatus.CREATED, engine_types_1.GameStatus.PUBLISHED, 'publish', 'organizer', 'GAME_PUBLISHED');
        // PUBLISHED -> WAITING_FOR_PLAYERS
        this.addTransition(engine_types_1.GameStatus.PUBLISHED, engine_types_1.GameStatus.WAITING_FOR_PLAYERS, 'openRegistration', 'organizer', 'REGISTRATION_OPENED');
        // WAITING_FOR_PLAYERS -> STARTED
        this.addTransition(engine_types_1.GameStatus.WAITING_FOR_PLAYERS, engine_types_1.GameStatus.STARTED, 'start', 'organizer', 'GAME_STARTED');
        // STARTED -> IN_PROGRESS
        this.addTransition(engine_types_1.GameStatus.STARTED, engine_types_1.GameStatus.IN_PROGRESS, 'assignFirstNode', 'engine', 'NODE_ASSIGNED');
        // IN_PROGRESS <-> PAUSED
        this.addTransition(engine_types_1.GameStatus.IN_PROGRESS, engine_types_1.GameStatus.PAUSED, 'pause', 'organizer', 'GAME_PAUSED');
        this.addTransition(engine_types_1.GameStatus.PAUSED, engine_types_1.GameStatus.IN_PROGRESS, 'resume', 'organizer', 'GAME_RESUMED');
        // IN_PROGRESS -> FINISHED
        this.addTransition(engine_types_1.GameStatus.IN_PROGRESS, engine_types_1.GameStatus.FINISHED, 'finish', 'engine', 'GAME_FINISHED');
        // FINISHED -> ARCHIVED
        this.addTransition(engine_types_1.GameStatus.FINISHED, engine_types_1.GameStatus.ARCHIVED, 'archive', 'admin', 'GAME_ARCHIVED');
    }
}
exports.GameStateMachine = GameStateMachine;
/**
 * Team State Machine
 * REGISTERED -> ACTIVE -> WAITING_ANSWER -> NODE_COMPLETED -> NEXT_NODE -> WAITING_ANSWER (loop)
 * WAITING_ANSWER -> NODE_FAILED -> WAITING_ANSWER (retry loop)
 * WAITING_ANSWER -> FINISHED
 */
class TeamStateMachine extends StateMachine {
    constructor() {
        super();
        this.defineTransitions();
    }
    defineTransitions() {
        // REGISTERED -> ACTIVE
        this.addTransition(engine_types_1.TeamStatus.REGISTERED, engine_types_1.TeamStatus.ACTIVE, 'gameStart', 'engine', 'TEAM_ACTIVATED');
        // ACTIVE -> WAITING_ANSWER
        this.addTransition(engine_types_1.TeamStatus.ACTIVE, engine_types_1.TeamStatus.WAITING_ANSWER, 'assignNode', 'engine', 'NODE_ASSIGNED');
        // WAITING_ANSWER -> NODE_COMPLETED
        this.addTransition(engine_types_1.TeamStatus.WAITING_ANSWER, engine_types_1.TeamStatus.NODE_COMPLETED, 'answerAccepted', 'engine', 'ANSWER_ACCEPTED');
        // NODE_COMPLETED -> NEXT_NODE
        this.addTransition(engine_types_1.TeamStatus.NODE_COMPLETED, engine_types_1.TeamStatus.NEXT_NODE, 'transition', 'engine', 'NODE_COMPLETED');
        // NEXT_NODE -> WAITING_ANSWER
        this.addTransition(engine_types_1.TeamStatus.NEXT_NODE, engine_types_1.TeamStatus.WAITING_ANSWER, 'assignNode', 'engine', 'NODE_ASSIGNED');
        // WAITING_ANSWER -> NODE_FAILED
        this.addTransition(engine_types_1.TeamStatus.WAITING_ANSWER, engine_types_1.TeamStatus.NODE_FAILED, 'answerRejected', 'engine', 'ANSWER_REJECTED');
        // NODE_FAILED -> WAITING_ANSWER (retry)
        this.addTransition(engine_types_1.TeamStatus.NODE_FAILED, engine_types_1.TeamStatus.WAITING_ANSWER, 'retry', 'engine', 'NODE_RETRY');
        // WAITING_ANSWER -> FINISHED (last node)
        this.addTransition(engine_types_1.TeamStatus.WAITING_ANSWER, engine_types_1.TeamStatus.FINISHED, 'gameFinish', 'engine', 'TEAM_FINISHED');
    }
}
exports.TeamStateMachine = TeamStateMachine;
//# sourceMappingURL=state-machine.js.map