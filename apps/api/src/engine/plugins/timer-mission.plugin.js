"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerMissionPlugin = void 0;
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
class TimerMissionPlugin {
    type = 'timer';
    name = 'Таймер';
    description = 'Задание с ограничением по времени';
    icon = '⏱️';
    version = plugin_sdk_1.SDK_VERSION;
    author = 'Adventure Engine Team';
    schema = {
        type: 'object',
        required: ['validation'],
        properties: {
            validation: {
                type: 'object',
                required: ['timeLimit'],
                properties: {
                    timeLimit: { type: 'number' },
                },
            },
            rewards: {
                type: 'object',
                properties: {
                    score: { type: 'number' },
                    bonusScore: { type: 'number' },
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
        const timeLimit = validation.timeLimit;
        if (typeof timeLimit !== 'number' || timeLimit <= 0) {
            return {
                valid: false,
                errors: [{ field: 'validation.timeLimit', message: 'Time limit must be a positive number' }],
            };
        }
        return { valid: true };
    }
    async execute(config, context) {
        const answer = context.getAnswer();
        const remainingTime = context.getRemainingTime();
        const maxIterations = context.getMaxIterations();
        const c = (config || {});
        const validation = (c.validation || {});
        const timeLimit = validation.timeLimit || 60; // seconds
        const rewards = (c.rewards || {});
        const penalties = (c.penalties || {});
        const baseScore = rewards.score || 10;
        const bonusScore = rewards.bonusScore || 0;
        // Check if time has run out
        if (remainingTime !== undefined && remainingTime <= 0) {
            const penalty = penalties.score || 0;
            if (penalty > 0) {
                context.addPenalty(penalty);
            }
            return {
                success: false,
                reason: 'Time limit exceeded',
                score: 0,
            };
        }
        if (!answer) {
            return { success: false, reason: 'No answer provided', score: 0 };
        }
        // For timer missions, any answer within time is accepted
        // Bonus score for fast answers
        let score = baseScore;
        if (bonusScore > 0 && remainingTime !== undefined) {
            const timeRatio = remainingTime / (timeLimit * 1000);
            score += Math.round(bonusScore * timeRatio);
        }
        if (score > 0) {
            context.addScore(score);
        }
        return { success: true, score };
    }
    serialize(config) {
        return config || {};
    }
    deserialize(data) {
        return data;
    }
}
exports.TimerMissionPlugin = TimerMissionPlugin;
//# sourceMappingURL=timer-mission.plugin.js.map