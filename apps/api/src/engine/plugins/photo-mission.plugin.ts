import {
  MissionPlugin,
  ExecutionContext,
  MissionResult,
  ValidationResult,
  SDK_VERSION,
} from '../plugin-sdk/plugin-sdk';

export class PhotoMissionPlugin implements MissionPlugin {
  readonly type = 'photo';
  readonly name = 'Фото-задание';
  readonly description = 'Игрок загружает фото для проверки организатором';
  readonly icon = '📸';
  readonly version = SDK_VERSION;
  readonly author = 'Adventure Engine Team';

  readonly schema = {
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

    return { valid: true };
  }

  async execute(
    config: unknown,
    context: ExecutionContext,
  ): Promise<MissionResult> {
    const photoUrl = context.getPhoto();

    if (!photoUrl) {
      return { success: false, reason: 'No photo provided', score: 0 };
    }

    const c = (config || {}) as Record<string, unknown>;
    const validation = (c.validation || {}) as Record<string, unknown>;
    const mode = (validation.mode as string) || 'manual';
    const rewards = (c.rewards || {}) as Record<string, number>;

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

  serialize(config: unknown): Record<string, unknown> {
    return (config as Record<string, unknown>) || {};
  }

  deserialize(data: Record<string, unknown>): unknown {
    return data;
  }
}
