"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRMissionPlugin = void 0;
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
class QRMissionPlugin {
    type = 'qr';
    name = 'QR-код';
    description = 'Игрок сканирует QR-код и вводит его содержимое';
    icon = '📱';
    version = plugin_sdk_1.SDK_VERSION;
    author = 'Adventure Engine Team';
    schema = {
        type: 'object',
        required: ['validation'],
        properties: {
            validation: {
                type: 'object',
                required: ['answers'],
                properties: {
                    mode: { type: 'string', enum: ['exact', 'regex'] },
                    answers: { type: 'array', items: { type: 'string' } },
                },
            },
            rewards: {
                type: 'object',
                properties: {
                    score: { type: 'number' },
                },
            },
            penalties: {
                type: 'object',
                properties: {
                    score: { type: 'number' },
                },
            },
        },
    };
    async validate(config) {
        if (!config || typeof config !== 'object') {
            return {
                valid: false,
                errors: [{ field: 'config', message: 'Config must be an object' }],
            };
        }
        const c = config;
        if (!c.validation || typeof c.validation !== 'object') {
            return {
                valid: false,
                errors: [{ field: 'validation', message: 'Validation config required' }],
            };
        }
        const validation = c.validation;
        if (!Array.isArray(validation.answers) || validation.answers.length === 0) {
            return {
                valid: false,
                errors: [{ field: 'validation.answers', message: 'At least one answer required' }],
            };
        }
        return { valid: true };
    }
    async execute(config, context) {
        const answer = context.getAnswer();
        if (!answer) {
            return { success: false, reason: 'No answer provided', score: 0 };
        }
        const c = (config || {});
        const validation = (c.validation || {});
        const answers = (validation.answers || []);
        const mode = validation.mode || 'exact';
        const rewards = (c.rewards || {});
        const penalties = (c.penalties || {});
        let isCorrect = false;
        switch (mode) {
            case 'regex':
                isCorrect = answers.some((pattern) => {
                    try {
                        const regex = new RegExp(pattern, 'i');
                        return regex.test(answer);
                    }
                    catch {
                        return false;
                    }
                });
                break;
            case 'exact':
            default:
                isCorrect = answers.some((a) => a.trim() === answer.trim());
                break;
        }
        if (isCorrect) {
            const score = rewards.score || 15;
            if (score > 0) {
                context.addScore(score);
            }
            return { success: true, score, items: [] };
        }
        else {
            const penalty = penalties.score || 0;
            if (penalty > 0) {
                context.addPenalty(penalty);
            }
            return {
                success: false,
                score: 0,
                reason: 'Incorrect QR code',
            };
        }
    }
    serialize(config) {
        return config || {};
    }
    deserialize(data) {
        return data;
    }
}
exports.QRMissionPlugin = QRMissionPlugin;
//# sourceMappingURL=qr-mission.plugin.js.map