import {
  MissionPlugin,
  ExecutionContext,
  MissionResult,
  ValidationResult,
  SDK_VERSION,
} from '../plugin-sdk/plugin-sdk';

export class QRMissionPlugin implements MissionPlugin {
  readonly type = 'qr';
  readonly name = 'QR-код';
  readonly description = 'Игрок сканирует QR-код и вводит его содержимое';
  readonly icon = '📱';
  readonly version = SDK_VERSION;
  readonly author = 'Adventure Engine Team';

  readonly schema = {
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
    if (!Array.isArray(validation.answers) || validation.answers.length === 0) {
      return {
        valid: false,
        errors: [{ field: 'validation.answers', message: 'At least one answer required' }],
      };
    }

    return { valid: true };
  }

  async execute(
    config: unknown,
    context: ExecutionContext,
  ): Promise<MissionResult> {
    const answer = context.getAnswer();

    if (!answer) {
      return { success: false, reason: 'No answer provided', score: 0 };
    }

    const c = (config || {}) as Record<string, unknown>;
    const validation = (c.validation || {}) as Record<string, unknown>;
    const answers = (validation.answers || []) as string[];
    const mode = (validation.mode as string) || 'exact';
    const rewards = (c.rewards || {}) as Record<string, number>;
    const penalties = (c.penalties || {}) as Record<string, number>;

    let isCorrect = false;

    switch (mode) {
      case 'regex':
        isCorrect = answers.some((pattern) => {
          try {
            const regex = new RegExp(pattern, 'i');
            return regex.test(answer);
          } catch {
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
    } else {
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

  serialize(config: unknown): Record<string, unknown> {
    return (config as Record<string, unknown>) || {};
  }

  deserialize(data: Record<string, unknown>): unknown {
    return data;
  }
}
