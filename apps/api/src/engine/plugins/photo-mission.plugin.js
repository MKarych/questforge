"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoMissionPlugin = void 0;
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
class PhotoMissionPlugin {
    type = 'photo';
    name = 'Фото-задание';
    description = 'Игрок загружает фото для проверки организатором';
    icon = '📸';
    version = plugin_sdk_1.SDK_VERSION;
    author = 'Adventure Engine Team';
    schema = {
        type: 'object',
        required: ['validation'],
        properties: {
            validation: {
                type: 'object',
                required: ['mode'],
                properties: {
                    mode: { type: 'string', enum: ['manual', 'ai'] },
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
        return { valid: true };
    }
    async execute(config, context) {
        const photoUrl = context.getPhoto();
        if (!photoUrl) {
            return { success: false, reason: 'No photo provided', score: 0 };
        }
        const c = (config || {});
        const validation = (c.validation || {});
        const mode = validation.mode || 'manual';
        const rewards = (c.rewards || {});
        // Photo missions always require manual review
        if (mode === 'manual') {
            return {
                success: false,
                score: 0,
                reason: 'pending_review',
                events: [{ type: 'PHOTO_SUBMITTED', payload: { photoUrl } }],
            };
        }
        // AI mode would integrate with AI service (placeholder)
        return {
            success: false,
            score: 0,
            reason: 'pending_review',
            events: [{ type: 'PHOTO_SUBMITTED', payload: { photoUrl } }],
        };
    }
    serialize(config) {
        return config || {};
    }
    deserialize(data) {
        return data;
    }
}
exports.PhotoMissionPlugin = PhotoMissionPlugin;
//# sourceMappingURL=photo-mission.plugin.js.map