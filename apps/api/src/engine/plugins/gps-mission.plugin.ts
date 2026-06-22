import {
  MissionPlugin,
  ExecutionContext,
  MissionResult,
  ValidationResult,
  SDK_VERSION,
} from '../plugin-sdk/plugin-sdk';

/**
 * Haversine formula for distance calculation in meters.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class GPSMissionPlugin implements MissionPlugin {
  readonly type = 'gps';
  readonly name = 'GPS-задание';
  readonly description = 'Игрок должен прибыть в определённую точку';
  readonly icon = '📍';
  readonly version = SDK_VERSION;
  readonly author = 'Adventure Engine Team';

  readonly schema = {
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
    const radius = validation.radius as number;
    if (typeof radius !== 'number' || radius <= 0) {
      return {
        valid: false,
        errors: [{ field: 'validation.radius', message: 'Radius must be a positive number' }],
      };
    }

    return { valid: true };
  }

  async execute(
    config: unknown,
    context: ExecutionContext,
  ): Promise<MissionResult> {
    const location = context.getLocation();

    if (!location) {
      return {
        success: false,
        reason: 'No GPS location provided',
        score: 0,
      };
    }

    const c = (config || {}) as Record<string, unknown>;
    const validation = (c.validation || {}) as Record<string, unknown>;
    const radius = (validation.radius as number) || 50; // default 50 meters
    const rewards = (c.rewards || {}) as Record<string, number>;
    const penalties = (c.penalties || {}) as Record<string, number>;

    // The orchestrator should pass target lat/lng via context state
    const state = context.getState();
    const targetLat = (state as any)?.currentNode?.lat as number;
    const targetLng = (state as any)?.currentNode?.lng as number;

    // If target coordinates are available, validate distance
    if (targetLat !== undefined && targetLng !== undefined) {
      const distance = haversineDistance(
        location.lat,
        location.lng,
        targetLat,
        targetLng,
      );

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

  serialize(config: unknown): Record<string, unknown> {
    return (config as Record<string, unknown>) || {};
  }

  deserialize(data: Record<string, unknown>): unknown {
    return data;
  }
}
