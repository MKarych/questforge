"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamStatus = exports.GameStatus = exports.EventType = void 0;
/**
 * Event types registry — must match Prisma schema EventType enum
 */
var EventType;
(function (EventType) {
    // Game events (must match Prisma schema)
    EventType["SESSION_CREATE"] = "SESSION_CREATE";
    EventType["SESSION_CREATED"] = "SESSION_CREATED";
    EventType["PLAYER_JOIN"] = "PLAYER_JOIN";
    EventType["PLAYER_ANSWER"] = "PLAYER_ANSWER";
    EventType["PLAYER_LEAVE"] = "PLAYER_LEAVE";
    EventType["HINT_REQUEST"] = "HINT_REQUEST";
    EventType["SOS_SEND"] = "SOS_SEND";
    EventType["GAME_START"] = "GAME_START";
    EventType["GAME_FINISH"] = "GAME_FINISH";
    EventType["NODE_ENTER"] = "NODE_ENTER";
    EventType["NODE_EXIT"] = "NODE_EXIT";
    EventType["SCORE_UPDATE"] = "SCORE_UPDATE";
    EventType["PENALTY_APPLIED"] = "PENALTY_APPLIED";
    EventType["HINT_REVEALED"] = "HINT_REVEALED";
    EventType["STATE_SYNC"] = "STATE_SYNC";
    EventType["TIMER_START"] = "TIMER_START";
    EventType["TIMER_END"] = "TIMER_END";
    EventType["ERROR_OCCURRED"] = "ERROR_OCCURRED";
    EventType["LEADERBOARD_UPDATE"] = "LEADERBOARD_UPDATE";
    // Internal engine events (backward compat aliases)
    EventType["GAME_CREATED"] = "GAME_CREATED";
    EventType["GAME_PUBLISHED"] = "GAME_PUBLISHED";
    EventType["GAME_STARTED"] = "GAME_STARTED";
    EventType["GAME_PAUSED"] = "GAME_PAUSED";
    EventType["GAME_RESUMED"] = "GAME_RESUMED";
    EventType["GAME_FINISHED"] = "GAME_FINISHED";
    EventType["TEAM_REGISTERED"] = "TEAM_REGISTERED";
    EventType["NODE_ASSIGNED"] = "NODE_ASSIGNED";
    EventType["ANSWER_SUBMITTED"] = "ANSWER_SUBMITTED";
    EventType["ANSWER_ACCEPTED"] = "ANSWER_ACCEPTED";
    EventType["ANSWER_REJECTED"] = "ANSWER_REJECTED";
    EventType["HINT_REQUESTED"] = "HINT_REQUESTED";
    EventType["HINT_SENT"] = "HINT_SENT";
    EventType["NODE_COMPLETED"] = "NODE_COMPLETED";
    EventType["NODE_FAILED"] = "NODE_FAILED";
    EventType["TEAM_FINISHED"] = "TEAM_FINISHED";
    EventType["TIME_TRAVEL"] = "TIME_TRAVEL";
    EventType["NODE_SKIPPED"] = "NODE_SKIPPED";
    EventType["ANSWER_OVERRIDDEN"] = "ANSWER_OVERRIDDEN";
})(EventType || (exports.EventType = EventType = {}));
/**
 * State types
 */
var GameStatus;
(function (GameStatus) {
    GameStatus["CREATED"] = "CREATED";
    GameStatus["PUBLISHED"] = "PUBLISHED";
    GameStatus["WAITING_FOR_PLAYERS"] = "WAITING_FOR_PLAYERS";
    GameStatus["STARTED"] = "STARTED";
    GameStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GameStatus["PAUSED"] = "PAUSED";
    GameStatus["FINISHED"] = "FINISHED";
    GameStatus["ARCHIVED"] = "ARCHIVED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var TeamStatus;
(function (TeamStatus) {
    TeamStatus["REGISTERED"] = "REGISTERED";
    TeamStatus["ACTIVE"] = "ACTIVE";
    TeamStatus["WAITING_ANSWER"] = "WAITING_ANSWER";
    TeamStatus["NODE_COMPLETED"] = "NODE_COMPLETED";
    TeamStatus["NODE_FAILED"] = "NODE_FAILED";
    TeamStatus["NEXT_NODE"] = "NEXT_NODE";
    TeamStatus["FINISHED"] = "FINISHED";
})(TeamStatus || (exports.TeamStatus = TeamStatus = {}));
//# sourceMappingURL=engine.types.js.map