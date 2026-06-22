import {
  MissionPlugin,
  ExecutionContext,
  MissionResult,
  ValidationResult,
  SDK_VERSION,
} from '../plugin-sdk/plugin-sdk';

export class TimerMissionPlugin implements MissionPlugin {
  readonly type = 'timer';
  readonly name = 'Таймер';
  readonly description = 'Задание с ограничением по времени';
  readonly icon = '⏱️';
  readonly version = SDK_VERSION;
  readonly author = 'Adventure Engine Team';

  readonly schema = {
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

  async validate(config: unknown): Promise<ValidationResult> {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        errors: [{ field: 'config', message: 'Config must be an object' }],
      };
    }

    const c = config as Record<string, unknown>;

    if (!c.validation || typeof c.validation !== 'object') {
      return {
        valid: false,
        errors: [{ field: 'validation', message: 'Validation config required' }],
      };
    }

    const validation = c.validation as Record<string, unknown>;
    const timeLimit = validation.timeLimit as number;
    if (typeof timeLimit !== 'number' || timeLimit <= 0) {
      return {
        valid: false,
        errors: [{ field: 'validation.timeLimit', message: 'Time limit must be a positive number' }],
      };
    }

    return { valid: true };
  }

  async execute(
    config: unknown,
    context: ExecutionContext,
  ): Promise<MissionResult> {
    const answer = context.getAnswer();
    const remainingTime = context.getRemainingTime();
    const maxIterations = context.getMaxIterations();

    const c = (config || {}) as Record<string, unknown>;
    const validation = (c.validation || {}) as Record<string, unknown>;
    const timeLimit = (validation.timeLimit as number) || 60; // seconds
    const rewards = (c.rewards || {}) as Record<string, number>;
    const penalties = (c.penalties || {}) as Record<string, number>;

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

  serialize(config: unknown): Record<string, unknown> {
    return (config as Record<string, unknown>) || {};
  }

  deserialize(data: Record<string, unknown>): unknown {
    return data;
  }
}
