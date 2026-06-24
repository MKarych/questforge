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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_store_1 = require("./event-store/event-store");
const engine_orchestrator_1 = require("./orchestrator/engine-orchestrator");
const plugin_sdk_1 = require("./plugin-sdk/plugin-sdk");
const text_mission_plugin_1 = require("./plugins/text-mission.plugin");
const code_mission_plugin_1 = require("./plugins/code-mission.plugin");
const photo_mission_plugin_1 = require("./plugins/photo-mission.plugin");
const gps_mission_plugin_1 = require("./plugins/gps-mission.plugin");
const qr_mission_plugin_1 = require("./plugins/qr-mission.plugin");
const choice_mission_plugin_1 = require("./plugins/choice-mission.plugin");
const timer_mission_plugin_1 = require("./plugins/timer-mission.plugin");
const state_machine_1 = require("./state-machine/state-machine");
const lock_manager_1 = require("./lock-manager/lock-manager");
const prisma_module_1 = require("../common/prisma/prisma.module");
let EngineModule = class EngineModule {
    pluginRegistry;
    textMissionPlugin;
    codeMissionPlugin;
    photoMissionPlugin;
    gpsMissionPlugin;
    qrMissionPlugin;
    choiceMissionPlugin;
    timerMissionPlugin;
    lockManager;
    constructor(pluginRegistry, textMissionPlugin, codeMissionPlugin, photoMissionPlugin, gpsMissionPlugin, qrMissionPlugin, choiceMissionPlugin, timerMissionPlugin, lockManager) {
        this.pluginRegistry = pluginRegistry;
        this.textMissionPlugin = textMissionPlugin;
        this.codeMissionPlugin = codeMissionPlugin;
        this.photoMissionPlugin = photoMissionPlugin;
        this.gpsMissionPlugin = gpsMissionPlugin;
        this.qrMissionPlugin = qrMissionPlugin;
        this.choiceMissionPlugin = choiceMissionPlugin;
        this.timerMissionPlugin = timerMissionPlugin;
        this.lockManager = lockManager;
    }
    onModuleInit() {
        // Register all default plugins
        this.pluginRegistry.register(this.textMissionPlugin);
        this.pluginRegistry.register(this.codeMissionPlugin);
        this.pluginRegistry.register(this.photoMissionPlugin);
        this.pluginRegistry.register(this.gpsMissionPlugin);
        this.pluginRegistry.register(this.qrMissionPlugin);
        this.pluginRegistry.register(this.choiceMissionPlugin);
        this.pluginRegistry.register(this.timerMissionPlugin);
    }
};
exports.EngineModule = EngineModule;
exports.EngineModule = EngineModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule],
        providers: [
            event_store_1.EventStore,
            engine_orchestrator_1.EngineOrchestrator,
            plugin_sdk_1.PluginRegistry,
            plugin_sdk_1.PluginSandbox,
            state_machine_1.GameStateMachine,
            state_machine_1.TeamStateMachine,
            lock_manager_1.LockManager,
            text_mission_plugin_1.TextMissionPlugin,
            code_mission_plugin_1.CodeMissionPlugin,
            photo_mission_plugin_1.PhotoMissionPlugin,
            gps_mission_plugin_1.GPSMissionPlugin,
            qr_mission_plugin_1.QRMissionPlugin,
            choice_mission_plugin_1.ChoiceMissionPlugin,
            timer_mission_plugin_1.TimerMissionPlugin,
        ],
        exports: [
            event_store_1.EventStore,
            engine_orchestrator_1.EngineOrchestrator,
            plugin_sdk_1.PluginRegistry,
            plugin_sdk_1.PluginSandbox,
            state_machine_1.GameStateMachine,
            state_machine_1.TeamStateMachine,
            lock_manager_1.LockManager,
        ],
    }),
    __metadata("design:paramtypes", [plugin_sdk_1.PluginRegistry,
        text_mission_plugin_1.TextMissionPlugin,
        code_mission_plugin_1.CodeMissionPlugin,
        photo_mission_plugin_1.PhotoMissionPlugin,
        gps_mission_plugin_1.GPSMissionPlugin,
        qr_mission_plugin_1.QRMissionPlugin,
        choice_mission_plugin_1.ChoiceMissionPlugin,
        timer_mission_plugin_1.TimerMissionPlugin,
        lock_manager_1.LockManager])
], EngineModule);
//# sourceMappingURL=engine.module.js.map