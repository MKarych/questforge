import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class CodeMissionPlugin implements MissionPlugin {
    readonly type = "code";
    readonly name = "\u041A\u043E\u0434\u043E\u0432\u043E\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u0435";
    readonly description = "\u0418\u0433\u0440\u043E\u043A \u0434\u043E\u043B\u0436\u0435\u043D \u0432\u0432\u0435\u0441\u0442\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u0434 \u0438\u043B\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0443";
    readonly icon = "\uD83D\uDCBB";
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
//# sourceMappingURL=code-mission.plugin.d.ts.map