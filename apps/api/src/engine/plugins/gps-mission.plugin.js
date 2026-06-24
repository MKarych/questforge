"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPSMissionPlugin = void 0;
const plugin_sdk_1 = require("../plugin-sdk/plugin-sdk");
/**
 * Haversine formula for distance calculation in meters.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
class GPSMissionPlugin {
    type = 'gps';
    name = 'GPS-задание';
    description = 'Игрок должен прибыть в определённую точку';
    icon = '📍';
    version = plugin_sdk_1.SDK_VERSION;
    author = 'Adventure Engine Team';
    schema = {
        type: 'object',
        required: ['validation'],
        properties: {
            validation: {
                type: 'object',
                required: ['radius'],
                properties: {
                    radius: { type: 'number' },
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
        const radius = validation.radius;
        if (typeof radius !== 'number' || radius <= 0) {
            return {
                valid: false,
                errors: [{ field: 'validation.radius', message: 'Radius must be a positive number' }],
            };
        }
        return { valid: true };
    }
    async execute(config, context) {
        const location = context.getLocation();
        if (!location) {
            return {
                success: false,
                reason: 'No GPS location provided',
                score: 0,
            };
        }
        const c = (config || {});
        const validation = (c.validation || {});
        const radius = validation.radius || 50; // default 50 meters
        const rewards = (c.rewards || {});
        const penalties = (c.penalties || {});
        // The orchestrator should pass target lat/lng via context state
        const state = context.getState();
        const targetLat = state?.currentNode?.lat;
        const targetLng = state?.currentNode?.lng;
        // If target coordinates are available, validate distance
        if (targetLat !== undefined && targetLng !== undefined) {
            const distance = haversineDistance(location.lat, location.lng, targetLat, targetLng);
            if (distance > radius) {
                const penalty = penalties.score || 0;
                if (penalty > 0) {
                    context.addPenalty(penalty);
                }
                return {
                    success: false,
                    reason: `Too far: ${Math.round(distance)}m away (max ${radius}m)`,
                    score: 0,
                };
            }
        }
        // Accept — player is within range
        const score = rewards.score || 20;
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
exports.GPSMissionPlugin = GPSMissionPlugin;
//# sourceMappingURL=gps-mission.plugin.js.map