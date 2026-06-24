import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class GPSMissionPlugin implements MissionPlugin {
    readonly type = "gps";
    readonly name = "GPS-\u0437\u0430\u0434\u0430\u043D\u0438\u0435";
    readonly description = "\u0418\u0433\u0440\u043E\u043A \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u0440\u0438\u0431\u044B\u0442\u044C \u0432 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u0443\u044E \u0442\u043E\u0447\u043A\u0443";
    readonly icon = "\uD83D\uDCCD";
    readonly version = "1.0.0";
    readonly author = "Adventure Engine Team";
    readonly schema: {
        type: string;
        required: string[];
        properties: {
            validation: {
                type: string;
                required: string[];
                properties: {
                    radius: {
                        type: string;
                    };
                };
            };
            rewards: {
                type: string;
                properties: {
                    score: {
                        type: string;
                    };
                };
            };
            penalties: {
                type: string;
                properties: {
                    score: {
                        type: string;
                    };
                };
            };
        };
    };
    validate(config: unknown): Promise<ValidationResult>;
    execute(config: unknown, context: ExecutionContext): Promise<MissionResult>;
    serialize(config: unknown): Record<string, unknown>;
    deserialize(data: Record<string, unknown>): unknown;
}
//# sourceMappingURL=gps-mission.plugin.d.ts.map