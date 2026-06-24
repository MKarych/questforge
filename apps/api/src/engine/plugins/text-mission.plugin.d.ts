import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class TextMissionPlugin implements MissionPlugin {
    readonly type = "text";
    readonly name = "\u0422\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u043E\u0442\u0432\u0435\u0442";
    readonly description = "\u0418\u0433\u0440\u043E\u043A \u0432\u0432\u043E\u0434\u0438\u0442 \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u043E\u0442\u0432\u0435\u0442";
    readonly icon = "\uD83D\uDCDD";
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
                    answers: {
                        type: string;
                        items: {
                            type: string;
                        };
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
//# sourceMappingURL=text-mission.plugin.d.ts.map