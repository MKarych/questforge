import { MissionPlugin, ExecutionContext, MissionResult, ValidationResult } from '../plugin-sdk/plugin-sdk';
export declare class QRMissionPlugin implements MissionPlugin {
    readonly type = "qr";
    readonly name = "QR-\u043A\u043E\u0434";
    readonly description = "\u0418\u0433\u0440\u043E\u043A \u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0435\u0442 QR-\u043A\u043E\u0434 \u0438 \u0432\u0432\u043E\u0434\u0438\u0442 \u0435\u0433\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435";
    readonly icon = "\uD83D\uDCF1";
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
//# sourceMappingURL=qr-mission.plugin.d.ts.map