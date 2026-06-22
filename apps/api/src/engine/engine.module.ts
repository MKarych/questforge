import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStore } from './event-store/event-store';
import { EngineOrchestrator } from './orchestrator/engine-orchestrator';
import { PluginRegistry, PluginSandbox } from './plugin-sdk/plugin-sdk';
import { TextMissionPlugin } from './plugins/text-mission.plugin';
import { CodeMissionPlugin } from './plugins/code-mission.plugin';
import { PhotoMissionPlugin } from './plugins/photo-mission.plugin';
import { GPSMissionPlugin } from './plugins/gps-mission.plugin';
import { QRMissionPlugin } from './plugins/qr-mission.plugin';
import { ChoiceMissionPlugin } from './plugins/choice-mission.plugin';
import { TimerMissionPlugin } from './plugins/timer-mission.plugin';
import { GameStateMachine, TeamStateMachine } from './state-machine/state-machine';
import { LockManager } from './lock-manager/lock-manager';

@Module({
  imports: [ConfigModule],
  providers: [
    EventStore,
    EngineOrchestrator,
    PluginRegistry,
    PluginSandbox,
    GameStateMachine,
    TeamStateMachine,
    LockManager,
    TextMissionPlugin,
    CodeMissionPlugin,
    PhotoMissionPlugin,
    GPSMissionPlugin,
    QRMissionPlugin,
    ChoiceMissionPlugin,
    TimerMissionPlugin,
  ],
  exports: [
    EventStore,
    EngineOrchestrator,
    PluginRegistry,
    PluginSandbox,
    GameStateMachine,
    TeamStateMachine,
    LockManager,
  ],
})
export class EngineModule implements OnModuleInit {
  constructor(
    private readonly pluginRegistry: PluginRegistry,
    private readonly textMissionPlugin: TextMissionPlugin,
    private readonly codeMissionPlugin: CodeMissionPlugin,
    private readonly photoMissionPlugin: PhotoMissionPlugin,
    private readonly gpsMissionPlugin: GPSMissionPlugin,
    private readonly qrMissionPlugin: QRMissionPlugin,
    private readonly choiceMissionPlugin: ChoiceMissionPlugin,
    private readonly timerMissionPlugin: TimerMissionPlugin,
    private readonly lockManager: LockManager,
  ) {}

  onModuleInit() {
    // Register all default plugins
    this.pluginRegistry.register(this.textMissionPlugin);
    this.pluginRegistry.register(this.codeMissionPlugin);
    this.pluginRegistry.register(this.photoMissionPlugin);
    this.pluginRegistry.register(this.gpsMissionPlugin);
    this.pluginRegistry.register(this.qrMissionPlugin);
    this.pluginRegistry.register(this.choiceMissionPlugin);
    this.pluginRegistry.register(this.timerMissionPlugin);
    this.lockManager; // Ensure it initializes
  }
}
