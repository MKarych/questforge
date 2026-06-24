// ============================================================
// 54. Plugin System Spec: Плагинная архитектура
// Версия: 1.0
// ============================================================

import {
  MissionType,
  MissionConfig,
  TextMissionConfig,
  CodeMissionConfig,
  PhotoMissionConfig,
  GpsMissionConfig,
  QrMissionConfig,
  ChoiceMissionConfig,
  CollectMissionConfig,
  DialogueMissionConfig,
  Reward,
  InventoryItem,
  ItemType,
} from '@/lib/editor-store/editor.types';
import {
  ExecutionContext,
  MissionResult,
} from '@/lib/runtime-engine/runtime-engine';

// ==================== 2. Интерфейс плагина (spec 54.2) ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MissionPlugin {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  icon: string;
  version: string;

  // Схема конфига (JSON Schema)
  configSchema: any;

  // Валидация конфига
  validate(config: any): ValidationResult;

  // Выполнение миссии
  execute(context: PluginExecutionContext, config: any): MissionResult;

  // Сериализация (для JSON контракта)
  serialize(config: any): any;

  // Десериализация
  deserialize(data: any): any;
}

// ==================== 3. Контекст выполнения плагина (spec 54.3) ====================

export interface PluginExecutionContext {
  sessionId: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    score: number;
    inventory: { items: InventoryItem[]; capacity: number };
    achievements: string[];
  };
  variables: Record<string, any>;
  inventory: { items: InventoryItem[]; capacity: number };

  answer: any;

  getAnswer(): any;
  getPhoto(): string | null;
  getLocation(): { lat: number; lng: number } | null;

  addScore(amount: number): void;
  addMoney(amount: number): void;
  addItem(item: { id: string; name: string; description: string; quantity: number }): void;
  hasItem(itemId: string): boolean;
  setVariable(name: string, value: any): void;
  getVariable(name: string): any;
}

export function createPluginContext(
  engineContext: ExecutionContext,
  answer: any
): PluginExecutionContext {
  return {
    sessionId: engineContext.session.id,
    teamId: engineContext.team.id,
    team: {
      id: engineContext.team.id,
      name: engineContext.team.name,
      score: engineContext.team.score,
      inventory: engineContext.team.inventory,
      achievements: engineContext.team.achievements.map((a) => a.id),
    },
    variables: { ...engineContext.variables },
    inventory: { ...engineContext.inventory, items: [...engineContext.inventory.items] },
    answer,

    getAnswer: () => answer,
    getPhoto: () => null,
    getLocation: () => null,

    addScore: (amount: number) => {
      engineContext.team.score += amount;
      engineContext.score += amount;
    },
    addMoney: (amount: number) => {
      engineContext.team.reputation += amount;
    },
    addItem: (item) => {
      const existing = engineContext.team.inventory.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        engineContext.team.inventory.items.push({
          id: item.id,
          name: item.name,
          description: item.description,
          type: 'quest' as ItemType,
          quantity: item.quantity,
          icon: '📦',
          effects: [],
        });
      }
    },
    hasItem: (itemId: string) => {
      return engineContext.team.inventory.items.some((i) => i.id === itemId);
    },
    setVariable: (name: string, value: any) => {
      engineContext.variables[name] = value;
    },
    getVariable: (name: string) => {
      return engineContext.variables[name];
    },
  };
}

// ==================== 5. Регистрация плагинов (spec 54.5) ====================

export class PluginRegistry {
  private plugins: Map<string, MissionPlugin> = new Map();

  register(plugin: MissionPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): MissionPlugin | undefined {
    return this.plugins.get(id);
  }

  getByType(type: MissionType): MissionPlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.type === type) return plugin;
    }
    return undefined;
  }

  getAll(): MissionPlugin[] {
    return Array.from(this.plugins.values());
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  clear(): void {
    this.plugins.clear();
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  get count(): number {
    return this.plugins.size;
  }
}

// ==================== 6. Плагины для всех типов миссий ====================

// 6.1. Text Mission Plugin
export class TextMissionPlugin implements MissionPlugin {
  id = 'text-mission';
  name = 'Текстовое задание';
  description = 'Проверка текстового ответа (exact, case_insensitive, regex)';
  type: MissionType = 'text';
  icon = '📝';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['correctAnswer'],
    properties: {
      correctAnswer: { type: 'string' },
      matchMode: { type: 'string', enum: ['exact', 'case_insensitive', 'regex'], default: 'exact' },
      maxAttempts: { type: 'number', default: 3 },
      points: { type: 'number', default: 10 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!config.correctAnswer || typeof config.correctAnswer !== 'string') {
      errors.push('correctAnswer is required and must be a string');
    }
    if (config.matchMode && !['exact', 'case_insensitive', 'regex'].includes(config.matchMode)) {
      errors.push('matchMode must be one of: exact, case_insensitive, regex');
    }
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const userAnswer = String(context.getAnswer() || '');
    const correctAnswer = String(config.correctAnswer || '');
    const matchMode = config.matchMode || 'exact';

    let isCorrect = false;
    switch (matchMode) {
      case 'case_insensitive':
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        break;
      case 'regex':
        try {
          isCorrect = new RegExp(correctAnswer).test(userAnswer);
        } catch {
          isCorrect = false;
        }
        break;
      case 'exact':
      default:
        isCorrect = userAnswer === correctAnswer;
        break;
    }

    if (isCorrect) {
      const score = config.points || 10;
      context.addScore(score);
      return { success: true, score, rewards: [], message: '✅ Правильно!' };
    }
    return { success: false, score: 0, rewards: [], message: '❌ Неправильный ответ' };
  }

  serialize(config: any): any {
    return { ...config };
  }

  deserialize(data: any): any {
    return { ...data };
  }
}

// 6.2. Code Mission Plugin
export class CodeMissionPlugin implements MissionPlugin {
  id = 'code-mission';
  name = 'Кодовое задание';
  description = 'Проверка ввода кода';
  type: MissionType = 'code';
  icon = '🔢';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['correctCode'],
    properties: {
      correctCode: { type: 'string' },
      maxAttempts: { type: 'number', default: 3 },
      points: { type: 'number', default: 20 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!config.correctCode) {
      errors.push('correctCode is required');
    }
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const userAnswer = String(context.getAnswer() || '');
    const correctCode = String(config.correctCode || '');

    if (userAnswer === correctCode) {
      const score = config.points || 20;
      context.addScore(score);
      return { success: true, score, rewards: [], message: '✅ Код верный!' };
    }
    return { success: false, score: 0, rewards: [], message: '❌ Неверный код' };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.3. Photo Mission Plugin
export class PhotoMissionPlugin implements MissionPlugin {
  id = 'photo-mission';
  name = 'Фото-задание';
  description = 'Загрузка фотографии (проверка вручную или AI)';
  type: MissionType = 'photo';
  icon = '📷';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    properties: {
      requirements: { type: 'string' },
      validationType: { type: 'string', enum: ['manual', 'ai'], default: 'manual' },
      points: { type: 'number', default: 20 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    return { valid: true, errors: [] };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    // Фото проверяется вручную или AI — для MVP всегда успех
    const score = config.points || 20;
    context.addScore(score);
    return { success: true, score, rewards: [], message: '📷 Фото загружено' };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.4. GPS Mission Plugin
export class GpsMissionPlugin implements MissionPlugin {
  id = 'gps-mission';
  name = 'GPS-задание';
  description = 'Проверка нахождения в указанной точке';
  type: MissionType = 'gps';
  icon = '📍';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat: { type: 'number' },
      lng: { type: 'number' },
      radius: { type: 'number', default: 50 },
      points: { type: 'number', default: 30 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (typeof config.lat !== 'number') errors.push('lat is required and must be a number');
    if (typeof config.lng !== 'number') errors.push('lng is required and must be a number');
    return { valid: errors.length === 0, errors };
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const answer = context.getAnswer();
    const lat = Number(answer?.lat || answer?.latitude || 0);
    const lng = Number(answer?.lng || answer?.longitude || 0);
    const targetLat = Number(config.lat || 0);
    const targetLng = Number(config.lng || 0);
    const radius = Number(config.radius || 50);

    const distance = this.calculateDistance(lat, lng, targetLat, targetLng);

    if (distance <= radius) {
      const score = config.points || 30;
      context.addScore(score);
      return { success: true, score, rewards: [], message: `📍 Вы на месте! (${Math.round(distance)}м)` };
    }
    return { success: false, score: 0, rewards: [], message: `📍 Вы слишком далеко (${Math.round(distance)}м)` };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.5. QR Mission Plugin
export class QrMissionPlugin implements MissionPlugin {
  id = 'qr-mission';
  name = 'QR-задание';
  description = 'Проверка QR-кода';
  type: MissionType = 'qr';
  icon = '📱';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['data'],
    properties: {
      data: { type: 'string' },
      points: { type: 'number', default: 25 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!config.data) errors.push('data is required');
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const userAnswer = String(context.getAnswer() || '');
    const correctData = String(config.data || '');

    if (userAnswer === correctData) {
      const score = config.points || 25;
      context.addScore(score);
      return { success: true, score, rewards: [], message: '📱 QR-код верный!' };
    }
    return { success: false, score: 0, rewards: [], message: '❌ Неверный QR-код' };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.6. Choice Mission Plugin
export class ChoiceMissionPlugin implements MissionPlugin {
  id = 'choice-mission';
  name = 'Выбор варианта';
  description = 'Выбор правильного варианта из списка';
  type: MissionType = 'choice';
  icon = '🎯';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['options', 'correctIndex'],
    properties: {
      options: { type: 'array', items: { type: 'string' }, minItems: 2 },
      correctIndex: { type: 'number' },
      shuffle: { type: 'boolean', default: false },
      points: { type: 'number', default: 10 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!Array.isArray(config.options) || config.options.length < 2) {
      errors.push('options must be an array with at least 2 items');
    }
    if (typeof config.correctIndex !== 'number') {
      errors.push('correctIndex is required and must be a number');
    }
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const userAnswer = Number(context.getAnswer());
    const correctIndex = Number(config.correctIndex);

    if (userAnswer === correctIndex) {
      const score = config.points || 10;
      context.addScore(score);
      return { success: true, score, rewards: [], message: '🎯 Правильный выбор!' };
    }
    return { success: false, score: 0, rewards: [], message: '❌ Неправильный выбор' };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.7. Collect Mission Plugin
export class CollectMissionPlugin implements MissionPlugin {
  id = 'collect-mission';
  name = 'Сбор предмета';
  description = 'Проверка наличия предмета в инвентаре';
  type: MissionType = 'collect';
  icon = '🎒';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['itemId'],
    properties: {
      itemId: { type: 'string' },
      itemName: { type: 'string' },
      quantity: { type: 'number', default: 1 },
      points: { type: 'number', default: 40 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!config.itemId) errors.push('itemId is required');
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    const itemId = config.itemId;
    const requiredQuantity = config.quantity || 1;

    if (context.hasItem(itemId)) {
      const score = config.points || 40;
      context.addScore(score);
      return { success: true, score, rewards: [], message: `🎒 Предмет "${config.itemName || itemId}" собран!` };
    }
    return { success: false, score: 0, rewards: [], message: `❌ Предмет "${config.itemName || itemId}" не найден` };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// 6.8. Dialogue Mission Plugin
export class DialogueMissionPlugin implements MissionPlugin {
  id = 'dialogue-mission';
  name = 'Диалог с NPC';
  description = 'Взаимодействие с персонажем через диалог';
  type: MissionType = 'dialogue';
  icon = '🗣';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['npcName'],
    properties: {
      npcName: { type: 'string' },
      npcDescription: { type: 'string' },
      dialogues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            npcText: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  targetSceneId: { type: 'string' },
                },
              },
            },
          },
        },
      },
      points: { type: 'number', default: 50 },
      penalty: { type: 'number', default: 0 },
    },
  };

  validate(config: any): ValidationResult {
    const errors: string[] = [];
    if (!config.npcName) errors.push('npcName is required');
    return { valid: errors.length === 0, errors };
  }

  execute(context: PluginExecutionContext, config: any): MissionResult {
    // Диалог всегда успешен для MVP
    const score = config.points || 50;
    context.addScore(score);
    return { success: true, score, rewards: [], message: `🗣 Диалог с ${config.npcName} завершён` };
  }

  serialize(config: any): any { return { ...config }; }
  deserialize(data: any): any { return { ...data }; }
}

// ==================== 7. Маркетплейс плагинов (spec 54.7) ====================

export interface PluginListing {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  price: number;
  authorId: string;
  rating: number;
  downloads: number;
  createdAt: Date;
}

// ==================== 8. Plugin Engine Integration ====================

/**
 * Интеграция плагинов с ExecutionEngine.
 * Позволяет выполнять миссии через плагины вместо встроенной логики.
 */
export class PluginEngine {
  private registry: PluginRegistry;

  constructor(registry?: PluginRegistry) {
    this.registry = registry || new PluginRegistry();
  }

  getRegistry(): PluginRegistry {
    return this.registry;
  }

  /**
   * Выполнение миссии через плагин.
   */
  executeMission(
    engineContext: ExecutionContext,
    missionType: MissionType,
    config: any,
    answer: any
  ): MissionResult {
    const plugin = this.registry.getByType(missionType);
    if (!plugin) {
      return {
        success: false,
        score: 0,
        rewards: [],
        message: `Плагин для типа "${missionType}" не найден`,
      };
    }

    const pluginContext = createPluginContext(engineContext, answer);
    return plugin.execute(pluginContext, config);
  }

  /**
   * Валидация конфига миссии через плагин.
   */
  validateConfig(missionType: MissionType, config: any): ValidationResult {
    const plugin = this.registry.getByType(missionType);
    if (!plugin) {
      return { valid: false, errors: [`Плагин для типа "${missionType}" не найден`] };
    }
    return plugin.validate(config);
  }
}

// ==================== 9. Фабрика плагинов по умолчанию ====================

/**
 * Создание реестра со всеми встроенными плагинами.
 */
export function createDefaultPluginRegistry(): PluginRegistry {
  const registry = new PluginRegistry();

  registry.register(new TextMissionPlugin());
  registry.register(new CodeMissionPlugin());
  registry.register(new PhotoMissionPlugin());
  registry.register(new GpsMissionPlugin());
  registry.register(new QrMissionPlugin());
  registry.register(new ChoiceMissionPlugin());
  registry.register(new CollectMissionPlugin());
  registry.register(new DialogueMissionPlugin());

  return registry;
}

/**
 * Создание PluginEngine со всеми встроенными плагинами.
 */
export function createDefaultPluginEngine(): PluginEngine {
  return new PluginEngine(createDefaultPluginRegistry());
}

// Singleton
let defaultPluginEngine: PluginEngine | null = null;

export function getPluginEngine(): PluginEngine {
  if (!defaultPluginEngine) {
    defaultPluginEngine = createDefaultPluginEngine();
  }
  return defaultPluginEngine;
}

export function resetPluginEngine(): void {
  defaultPluginEngine = null;
}