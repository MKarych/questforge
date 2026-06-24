"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_mission_plugin_1 = require("../../../src/engine/plugins/text-mission.plugin");
const plugin_sdk_1 = require("../../../src/engine/plugin-sdk/plugin-sdk");
const engine_types_1 = require("../../../src/engine/types/engine.types");
describe('TextMissionPlugin', () => {
    let plugin;
    let mockContext;
    beforeEach(() => {
        plugin = new text_mission_plugin_1.TextMissionPlugin();
        const mockState = {
            sessionId: 'session-1',
            teamId: 'team-1',
            teamName: 'Test Team',
            gameId: 'game-1',
            currentNodeId: 'node-1',
            score: 0,
            penalties: 0,
            status: engine_types_1.TeamStatus.WAITING_ANSWER,
            startedAt: Date.now(),
            history: [],
        };
        mockContext = new plugin_sdk_1.ExecutionContextImpl(mockState, '');
    });
    describe('validate', () => {
        it('should validate correct config', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                    answers: ['test answer'],
                },
                rewards: { score: 10 },
            };
            const result = await plugin.validate(config);
            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
        });
        it('should reject config without validation', async () => {
            const config = {
                rewards: { score: 10 },
            };
            const result = await plugin.validate(config);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });
        it('should reject config without answers', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                },
            };
            const result = await plugin.validate(config);
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });
    describe('execute - exact mode', () => {
        it('should accept correct answer (case insensitive)', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                    answers: ['Test Answer'],
                },
                rewards: { score: 10 },
            };
            mockContext.setAnswer('test answer');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(true);
            expect(result.score).toBe(10);
            expect(result.reason).toBeUndefined();
        });
        it('should reject incorrect answer', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                    answers: ['Correct Answer'],
                },
                penalties: { score: 1 },
            };
            mockContext.setAnswer('Wrong Answer');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(false);
            expect(result.score).toBe(0);
            expect(result.reason).toBe('Incorrect answer');
        });
        it('should handle multiple valid answers', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                    answers: ['Answer1', 'Answer2', 'Answer3'],
                },
                rewards: { score: 10 },
            };
            mockContext.setAnswer('answer2');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(true);
            expect(result.score).toBe(10);
        });
    });
    describe('execute - contains mode', () => {
        it('should accept answer containing keyword', async () => {
            const config = {
                validation: {
                    mode: 'contains',
                    answers: ['key'],
                },
                rewards: { score: 10 },
            };
            mockContext.setAnswer('This contains KEY word');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(true);
            expect(result.score).toBe(10);
        });
    });
    describe('execute - regex mode', () => {
        it('should accept answer matching regex', async () => {
            const config = {
                validation: {
                    mode: 'regex',
                    answers: ['^\\d{5}$'],
                },
                rewards: { score: 10 },
            };
            mockContext.setAnswer('12345');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(true);
            expect(result.score).toBe(10);
        });
        it('should reject answer not matching regex', async () => {
            const config = {
                validation: {
                    mode: 'regex',
                    answers: ['^\\d{5}$'],
                },
            };
            mockContext.setAnswer('abcde');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(false);
        });
    });
    describe('execute - no answer', () => {
        it('should reject when no answer provided', async () => {
            const config = {
                validation: {
                    mode: 'exact',
                    answers: ['test'],
                },
            };
            mockContext.setAnswer('');
            const result = await plugin.execute(config, mockContext);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('No answer provided');
            expect(result.score).toBe(0);
        });
    });
    describe('metadata', () => {
        it('should have correct metadata', () => {
            expect(plugin.type).toBe('TEXT_MISSION');
            expect(plugin.name).toBe('Текстовый ответ');
            expect(plugin.version).toBe('1.0.0');
        });
    });
});
//# sourceMappingURL=text-mission-plugin.test.js.map