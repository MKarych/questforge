import { OnModuleInit } from '@nestjs/common';
import { PluginRegistry } from './plugin-sdk/plugin-sdk';
import { TextMissionPlugin } from './plugins/text-mission.plugin';
import { CodeMissionPlugin } from './plugins/code-mission.plugin';
import { PhotoMissionPlugin } from './plugins/photo-mission.plugin';
import { GPSMissionPlugin } from './plugins/gps-mission.plugin';
import { QRMissionPlugin } from './plugins/qr-mission.plugin';
import { ChoiceMissionPlugin } from './plugins/choice-mission.plugin';
import { TimerMissionPlugin } from './plugins/timer-mission.plugin';
import { LockManager } from './lock-manager/lock-manager';
export declare class EngineModule implements OnModuleInit {
    private readonly pluginRegistry;
    private readonly textMissionPlugin;
    private readonly codeMissionPlugin;
    private readonly photoMissionPlugin;
    private readonly gpsMissionPlugin;
    private readonly qrMissionPlugin;
    private readonly choiceMissionPlugin;
    private readonly timerMissionPlugin;
    private readonly lockManager;
    constructor(pluginRegistry: PluginRegistry, textMissionPlugin: TextMissionPlugin, codeMissionPlugin: CodeMissionPlugin, photoMissionPlugin: PhotoMissionPlugin, gpsMissionPlugin: GPSMissionPlugin, qrMissionPlugin: QRMissionPlugin, choiceMissionPlugin: ChoiceMissionPlugin, timerMissionPlugin: TimerMissionPlugin, lockManager: LockManager);
    onModuleInit(): void;
}
//# sourceMappingURL=engine.module.d.ts.map