import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class TimerMissionPlugin implements MissionPlugin {
    readonly type = "timer";
    readonly name = "\u0422\u0430\u0439\u043C\u0435\u0440";
    readonly description = "\u0417\u0430\u0434\u0430\u043D\u0438\u0435 \u0441 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435\u043C \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438";
    readonly icon = "\u23F1\uFE0F";
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
                    timeLimit: {
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
                    bonusScore: {
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
//# sourceMappingURL=timer-mission.plugin.d.ts.map