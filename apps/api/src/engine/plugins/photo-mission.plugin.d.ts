import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class PhotoMissionPlugin implements MissionPlugin {
    readonly type = "photo";
    readonly name = "\u0424\u043E\u0442\u043E-\u0437\u0430\u0434\u0430\u043D\u0438\u0435";
    readonly description = "\u0418\u0433\u0440\u043E\u043A \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442 \u0444\u043E\u0442\u043E \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u043E\u043C";
    readonly icon = "\uD83D\uDCF8";
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
                    mode: {
                        type: string;
                        enum: string[];
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
//# sourceMappingURL=photo-mission.plugin.d.ts.map