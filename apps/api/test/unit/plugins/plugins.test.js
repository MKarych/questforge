"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_mission_plugin_1 = require("../../../../src/engine/plugins/text-mission.plugin");
const code_mission_plugin_1 = require("../../../../src/engine/plugins/code-mission.plugin");
const choice_mission_plugin_1 = require("../../../../src/engine/plugins/choice-mission.plugin");
const qr_mission_plugin_1 = require("../../../../src/engine/plugins/qr-mission.plugin");
const photo_mission_plugin_1 = require("../../../../src/engine/plugins/photo-mission.plugin");
const gps_mission_plugin_1 = require("../../../../src/engine/plugins/gps-mission.plugin");
const timer_mission_plugin_1 = require("../../../../src/engine/plugins/timer-mission.plugin");
const plugin_sdk_1 = require("../../../../src/engine/plugin-sdk/plugin-sdk");
describe('TextMissionPlugin', () => {
    const plugin = new text_mission_plugin_1.TextMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('text');
    });
    it('should validate correct config', async () => {
        const result = await plugin.validate({
            validation: { mode: 'exact', answers: ['Paris'] },
            rewards: { score: 10 },
        });
        expect(result.valid).toBe(true);
    });
    it('should reject invalid config', async () => {
        const result = await plugin.validate({});
        expect(result.valid).toBe(false);
    });
    it('should accept correct answer (exact mode)', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'Paris');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['Paris'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
        expect(result.score).toBe(10);
    });
    it('should reject incorrect answer', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'London');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['Paris'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('Incorrect answer');
    });
    it('should be case-insensitive', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'paris');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['Paris'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
    });
    it('should support regex mode', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'Paris123');
        const result = await plugin.execute({ validation: { mode: 'regex', answers: ['Paris\\d+'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
    });
    it('should support contains mode', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'I love Paris');
        const result = await plugin.execute({ validation: { mode: 'contains', answers: ['Paris'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
    });
    it('should return no score for empty answer', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, '');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['Paris'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(false);
        expect(result.score).toBe(0);
    });
});
describe('CodeMissionPlugin', () => {
    const plugin = new code_mission_plugin_1.CodeMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('code');
    });
    it('should accept correct code (exact mode)', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'secret123');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['secret123'] }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(true);
        expect(result.score).toBe(15);
    });
    it('should accept correct code (case-insensitive mode)', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'Secret123');
        const result = await plugin.execute({ validation: { mode: 'case-insensitive', answers: ['secret123'] }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(true);
    });
    it('should accept correct code (regex mode)', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'abc_def');
        const result = await plugin.execute({ validation: { mode: 'regex', answers: ['[a-z]+_[a-z]+'] }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(true);
    });
    it('should reject incorrect code', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'wrong');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['secret123'] }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(false);
    });
});
describe('ChoiceMissionPlugin', () => {
    const plugin = new choice_mission_plugin_1.ChoiceMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('choice');
    });
    it('should accept correct choice', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'B');
        const result = await plugin.execute({ validation: { answers: ['B'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
    });
    it('should reject incorrect choice', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'D');
        const result = await plugin.execute({ validation: { answers: ['B'] }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(false);
    });
});
describe('QRMissionPlugin', () => {
    const plugin = new qr_mission_plugin_1.QRMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('qr');
    });
    it('should accept correct QR code', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, 'ABC123');
        const result = await plugin.execute({ validation: { mode: 'exact', answers: ['ABC123'] }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(true);
    });
});
describe('PhotoMissionPlugin', () => {
    const plugin = new photo_mission_plugin_1.PhotoMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('photo');
    });
    it('should return pending_review when photo provided', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, '');
        context.setPhoto('https://example.com/photo.jpg');
        const result = await plugin.execute({ validation: { mode: 'manual' }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('pending_review');
    });
    it('should reject when no photo provided', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, '');
        const result = await plugin.execute({ validation: { mode: 'manual' }, rewards: { score: 15 } }, context);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('No photo provided');
    });
});
describe('GPSMissionPlugin', () => {
    const plugin = new gps_mission_plugin_1.GPSMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('gps');
    });
    it('should reject when no location provided', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, '');
        const result = await plugin.execute({ validation: { radius: 50 }, rewards: { score: 20 } }, context);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('No GPS location provided');
    });
    it('should accept location without target coords', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({}, '');
        context.setLocation({ lat: 55.7558, lng: 37.6173 });
        const result = await plugin.execute({ validation: { radius: 50 }, rewards: { score: 20 } }, context);
        expect(result.success).toBe(true);
        expect(result.score).toBe(20);
    });
    it('should accept location within radius of target', async () => {
        const state = {
            currentNode: { lat: 55.7558, lng: 37.6173 },
        };
        const context = new plugin_sdk_1.ExecutionContextImpl(state, '');
        context.setLocation({ lat: 55.7560, lng: 37.6180 }); // ~200m away
        const result = await plugin.execute({ validation: { radius: 500 }, rewards: { score: 20 } }, context);
        expect(result.success).toBe(true);
    });
    it('should reject location outside radius', async () => {
        const state = {
            currentNode: { lat: 55.7558, lng: 37.6173 },
        };
        const context = new plugin_sdk_1.ExecutionContextImpl(state, '');
        context.setLocation({ lat: 55.8000, lng: 37.7000 }); // ~7km away
        const result = await plugin.execute({ validation: { radius: 50 }, rewards: { score: 20 } }, context);
        expect(result.success).toBe(false);
    });
});
describe('TimerMissionPlugin', () => {
    const plugin = new timer_mission_plugin_1.TimerMissionPlugin();
    it('should have correct type', () => {
        expect(plugin.type).toBe('timer');
    });
    it('should reject when no answer provided', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({ startedAt: Date.now() }, '');
        const result = await plugin.execute({ validation: { timeLimit: 60 }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(false);
    });
    it('should accept answer with time remaining', async () => {
        const context = new plugin_sdk_1.ExecutionContextImpl({ startedAt: Date.now() }, 'answer');
        const result = await plugin.execute({ validation: { timeLimit: 60 }, rewards: { score: 10 } }, context);
        expect(result.success).toBe(true);
    });
});
//# sourceMappingURL=plugins.test.js.map