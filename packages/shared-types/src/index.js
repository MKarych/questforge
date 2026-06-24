"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.Capability = void 0;
var Capability;
(function (Capability) {
    Capability["HOST_EVENTS"] = "HOST_EVENTS";
    Capability["CREATE_SCENARIOS"] = "CREATE_SCENARIOS";
    Capability["SELL_SCENARIOS"] = "SELL_SCENARIOS";
    Capability["CREATE_TEAM"] = "CREATE_TEAM";
    Capability["STREAM_GAME"] = "STREAM_GAME";
    Capability["MODERATE_CONTENT"] = "MODERATE_CONTENT";
})(Capability || (exports.Capability = Capability = {}));
// Error codes
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["AUTH_REQUIRED"] = "AUTH_REQUIRED";
    ErrorCode["AUTH_EXPIRED"] = "AUTH_EXPIRED";
    ErrorCode["AUTH_INVALID"] = "AUTH_INVALID";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ErrorCode["SESSION_LOCKED"] = "SESSION_LOCKED";
    ErrorCode["INVALID_ANSWER"] = "INVALID_ANSWER";
    ErrorCode["NODE_NOT_FOUND"] = "NODE_NOT_FOUND";
    ErrorCode["GAME_NOT_ACTIVE"] = "GAME_NOT_ACTIVE";
    ErrorCode["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
//# sourceMappingURL=index.js.map