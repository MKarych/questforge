"use strict";
// ============================================================
// User Domain Types — полная типизация по контракту
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLifecycleStage = exports.Capability = void 0;
// ============================================================
// CAPABILITIES (автоматически вычисляемые права)
// ============================================================
var Capability;
(function (Capability) {
    Capability["HOST_EVENTS"] = "HOST_EVENTS";
    Capability["CREATE_SCENARIOS"] = "CREATE_SCENARIOS";
    Capability["SELL_SCENARIOS"] = "SELL_SCENARIOS";
    Capability["CREATE_TEAM"] = "CREATE_TEAM";
    Capability["STREAM_GAME"] = "STREAM_GAME";
    Capability["MODERATE_CONTENT"] = "MODERATE_CONTENT";
})(Capability || (exports.Capability = Capability = {}));
// ============================================================
// USER LIFECYCLE
// ============================================================
var UserLifecycleStage;
(function (UserLifecycleStage) {
    UserLifecycleStage["REGISTERED"] = "REGISTERED";
    UserLifecycleStage["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    UserLifecycleStage["FIRST_GAME"] = "FIRST_GAME";
    UserLifecycleStage["AUTHOR"] = "AUTHOR";
    UserLifecycleStage["ORGANIZER"] = "ORGANIZER";
    UserLifecycleStage["PREMIUM"] = "PREMIUM";
    UserLifecycleStage["INACTIVE"] = "INACTIVE";
    UserLifecycleStage["DELETED"] = "DELETED";
})(UserLifecycleStage || (exports.UserLifecycleStage = UserLifecycleStage = {}));
//# sourceMappingURL=user-types.js.map