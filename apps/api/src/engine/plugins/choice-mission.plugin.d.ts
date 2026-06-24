import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class ChoiceMissionPlugin implements MissionPlugin {
    readonly type = "choice";
    readonly name = "\u0412\u044B\u0431\u043E\u0440 \u043E\u0442\u0432\u0435\u0442\u0430";
    readonly description = "\u041C\u043D\u043E\u0436\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0432\u044B\u0431\u043E\u0440 \u0438\u0437 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u043E\u0432";
    readonly icon = "\uD83D\uDD18";
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
//# sourceMappingURL=choice-mission.plugin.d.ts.map