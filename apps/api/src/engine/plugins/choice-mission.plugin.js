"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceMissionPlugin = void 0;
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
class ChoiceMissionPlugin {
    type = 'choice';
    name = 'Выбор ответа';
    description = 'Множественный выбор из предложенных вариантов';
    icon = '🔘';
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
        const rewards = (c.rewards || {});
        const penalties = (c.penalties || {});
        const isCorrect = answers.some((a) => a.trim().toLowerCase() === answer.trim().toLowerCase());
        if (isCorrect) {
            const score = rewards.score || 10;
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
                reason: 'Incorrect choice',
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
exports.ChoiceMissionPlugin = ChoiceMissionPlugin;
//# sourceMappingURL=choice-mission.plugin.js.map