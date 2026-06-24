// ============================================================
// 51. Scenario JSON Contract: Контракт между редактором и движком
// Версия: 1.0
// ============================================================

import {
  Scenario,
  Scene,
  Mission,
  MissionConfig,
  Transition,
  VariableDefinition,
  Reward,
  Condition,
  SingleCondition,
  ConditionGroup,
  Edge,
  View,
  ViewElement,
} from '@/lib/editor-store/editor.types';

// ==================== JSON Schema Types (spec 51) ====================

export interface ScenarioDefinition {
  version: string;
  metadata: ScenarioMetadataDef;
  scenes: SceneDefinition[];
  variables: VariableDefinitionDef[];
  rewards: RewardDefinitionDef[];
  permissions: PermissionDefinition[];
  triggers: TriggerDefinitionDef[];
}

export interface ScenarioMetadataDef {
  id: string;
  name: string;
  description: string;
  authorId: string;
  city?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SceneDefinition {
  id: string;
  type: 'start' | 'finish' | 'location' | 'quiz' | 'dialogue' | 'game' | 'slide';
  title: string;
  description: string;
  missions: MissionDefinitionDef[];
  transitions: TransitionDefinitionDef[];
  view: ViewDefinitionDef;
  metadata: {
    gps?: { lat: number; lng: number; radius: number };
    timer?: number;
    requiredRole?: string;
  };
}

export interface MissionDefinitionDef {
  id: string;
  type: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'collect' | 'dialogue';
  title: string;
  description: string;
  config: any;
  rewards: RewardRefDef[];
  hints: string[];
}

export interface RewardRefDef {
  id: string;
  type: 'score' | 'money' | 'item' | 'achievement' | 'variable' | 'experience';
  payload: any;
}

export interface TransitionDefinitionDef {
  id: string;
  from: string;
  to: string;
  condition: ConditionGroupDef;
  label?: string;
}

export interface ConditionGroupDef {
  operator: 'AND' | 'OR';
  conditions: (SingleConditionDef | ConditionGroupDef)[];
}

export interface SingleConditionDef {
  type: 'variable' | 'score' | 'inventory' | 'flag' | 'role' | 'time';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'has';
  left: string | number | boolean;
  right: string | number | boolean;
}

export interface VariableDefinitionDef {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  scope: 'local' | 'global';
}

export interface RewardDefinitionDef {
  id: string;
  type: 'score' | 'money' | 'item' | 'achievement' | 'variable' | 'experience';
  payload: any;
}

export interface PermissionDefinition {
  role: string;
  action: string;
  resource: string;
}

export interface TriggerDefinitionDef {
  id: string;
  event: string;
  conditions: ConditionGroupDef;
  actions: ActionDef[];
}

export interface ActionDef {
  id: string;
  type: string;
  label: string;
  config: any;
}

export interface ViewDefinitionDef {
  type: string;
  config: {
    background?: string;
    layout?: string;
    elements?: any[];
    interactive?: boolean;
  };
}

// ==================== Validation Result ====================

export interface JsonValidationResult {
  valid: boolean;
  errors: JsonValidationError[];
  warnings: JsonValidationWarning[];
}

export interface JsonValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface JsonValidationWarning {
  path: string;
  message: string;
}

// ==================== Migrations ====================

interface ScenarioMigration {
  from: string;
  to: string;
  migrate(data: any): any;
}

const migrations: ScenarioMigration[] = [
  {
    from: '1.0',
    to: '1.1',
    migrate: (data) => {
      data.metadata.difficulty = data.metadata.difficulty || 'medium';
      data.triggers = data.triggers || [];
      data.permissions = data.permissions || [];
      return data;
    },
  },
];

// ==================== Serializer: Editor Scenario → JSON ====================

export function serializeScenario(scenario: Scenario): ScenarioDefinition {
  return {
    version: '1.0',
    metadata: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      authorId: scenario.metadata?.authorId || '',
      city: scenario.metadata?.city,
      duration: scenario.metadata?.duration,
      difficulty: scenario.metadata?.difficulty,
      tags: scenario.metadata?.tags || [],
      createdAt: scenario.createdAt instanceof Date ? scenario.createdAt.toISOString() : String(scenario.createdAt),
      updatedAt: scenario.updatedAt instanceof Date ? scenario.updatedAt.toISOString() : String(scenario.updatedAt),
    },
    scenes: scenario.scenes.map(serializeScene),
    variables: scenario.variables.map(serializeVariable),
    rewards: serializeRewards(scenario),
    permissions: [],
    triggers: [],
  };
}

function serializeScene(scene: Scene): SceneDefinition {
  return {
    id: scene.id,
    type: mapSceneType(scene.type),
    title: scene.title,
    description: scene.description || '',
    missions: scene.missions.map(serializeMission),
    transitions: scene.transitions.map(serializeTransition),
    view: serializeView(scene.view),
    metadata: {
      gps: scene.metadata?.gps,
      timer: scene.metadata?.timer,
      requiredRole: scene.metadata?.requiredRole,
    },
  };
}

function mapSceneType(type: string): SceneDefinition['type'] {
  const map: Record<string, SceneDefinition['type']> = {
    location: 'location',
    quiz: 'quiz',
    dialogue: 'dialogue',
    game: 'game',
    slide: 'slide',
  };
  return map[type] || 'location';
}

function serializeMission(mission: Mission): MissionDefinitionDef {
  return {
    id: mission.id,
    type: mission.type as MissionDefinitionDef['type'],
    title: mission.title,
    description: mission.description,
    config: mission.config,
    rewards: mission.rewards.map((r, idx) => ({
      id: `reward-${mission.id}-${idx}`,
      type: r.type as RewardRefDef['type'],
      payload: r,
    })),
    hints: mission.hints.map((h) => h.text),
  };
}

function serializeTransition(transition: Transition): TransitionDefinitionDef {
  return {
    id: transition.id,
    from: transition.fromSceneId,
    to: transition.toSceneId,
    condition: serializeCondition(transition.condition),
    label: transition.label,
  };
}

function serializeCondition(condition: Condition): ConditionGroupDef {
  if ('operator' in condition && 'conditions' in condition) {
    // ConditionGroup
    const group = condition as ConditionGroup;
    return {
      operator: group.operator,
      conditions: group.conditions.map((c) => serializeCondition(c)),
    };
  }
  // SingleCondition — оборачиваем в группу
  const sc = condition as SingleCondition;
  return {
    operator: 'AND',
    conditions: [
      {
        type: sc.type as SingleConditionDef['type'],
        operator: sc.operator as SingleConditionDef['operator'],
        left: sc.left,
        right: sc.right,
      },
    ],
  };
}

function serializeView(view?: View): ViewDefinitionDef {
  return {
    type: view?.type || 'card',
    config: {
      background: view?.config?.background,
      layout: view?.config?.layout,
      elements: view?.config?.elements,
      interactive: view?.config?.interactive,
    },
  };
}

function serializeVariable(v: VariableDefinition): VariableDefinitionDef {
  return {
    id: v.name,
    name: v.name,
    type: (v.type as VariableDefinitionDef['type']) || 'string',
    defaultValue: v.defaultValue,
    scope: v.scope || 'local',
  };
}

function serializeRewards(scenario: Scenario): RewardDefinitionDef[] {
  const rewards: RewardDefinitionDef[] = [];
  for (const scene of scenario.scenes) {
    for (const mission of scene.missions) {
      mission.rewards.forEach((r, idx) => {
        rewards.push({
          id: `reward-${mission.id}-${idx}`,
          type: r.type as RewardDefinitionDef['type'],
          payload: r,
        });
      });
    }
  }
  return rewards;
}

// ==================== Deserializer: JSON → Editor Scenario ====================

export interface DeserializedScenario {
  scenario: Partial<Scenario>;
  edges: Edge[];
}

export function deserializeScenario(json: ScenarioDefinition): DeserializedScenario {
  const scenes: Scene[] = json.scenes.map((s) => deserializeScene(s));

  // Восстанавливаем переходы
  const edges: Edge[] = [];
  for (const scene of scenes) {
    for (const transition of scene.transitions) {
      edges.push({
        id: transition.id,
        source: transition.fromSceneId,
        target: transition.toSceneId,
        animated: false,
        data: { label: transition.label },
      });
    }
  }

  return {
    scenario: {
      id: json.metadata.id,
      name: json.metadata.name,
      description: json.metadata.description,
      scenes,
      variables: json.variables.map(deserializeVariable),
      metadata: {
        authorId: json.metadata.authorId,
        city: json.metadata.city,
        duration: json.metadata.duration,
        difficulty: json.metadata.difficulty,
        tags: json.metadata.tags,
        settings: {
          totalTime: json.metadata.duration || 0,
          defaultPoints: 10,
          defaultPenalty: 0,
          hintLimit: 3,
          maxAttempts: 3,
          variables: [],
        },
      },
      status: 'draft',
      version: 1,
      createdAt: new Date(json.metadata.createdAt),
      updatedAt: new Date(json.metadata.updatedAt),
      deletedAt: null,
      startSceneId: scenes[0]?.id || '',
    },
    edges,
  };
}

function deserializeScene(sd: SceneDefinition): Scene {
  const missions: Mission[] = sd.missions.map(deserializeMission);

  const transitions: Transition[] = sd.transitions.map((t) => ({
    id: t.id,
    fromSceneId: t.from,
    toSceneId: t.to,
    condition: deserializeCondition(t.condition),
    type: 'conditional' as const,
    label: t.label,
  }));

  return {
    id: sd.id,
    type: mapJsonSceneType(sd.type),
    title: sd.title,
    description: sd.description,
    missions,
    transitions,
    view: deserializeView(sd.view),
    position: { x: 0, y: 0 },
    metadata: {
      gps: sd.metadata?.gps,
      timer: sd.metadata?.timer,
      requiredRole: sd.metadata?.requiredRole,
    },
  };
}

function mapJsonSceneType(type: string): Scene['type'] {
  const map: Record<string, Scene['type']> = {
    start: 'location',
    finish: 'location',
    location: 'location',
    quiz: 'quiz',
    dialogue: 'dialogue',
    game: 'game',
    slide: 'slide',
  };
  return map[type] || 'custom';
}

function deserializeMission(md: MissionDefinitionDef): Mission {
  return {
    id: md.id,
    type: md.type as Mission['type'],
    title: md.title,
    description: md.description,
    config: md.config as MissionConfig,
    rewards: md.rewards.map((r) => ({
      type: r.type as Reward['type'],
      value: typeof r.payload === 'object' && r.payload !== null ? (r.payload as any).value || 0 : 0,
      target: 'player' as const,
    })),
    conditions: [],
    hints: md.hints.map((text, idx) => ({
      id: `hint-${md.id}-${idx}`,
      text,
      order: idx,
    })),
  };
}

function deserializeCondition(cd: ConditionGroupDef): Condition {
  if (cd.conditions.length === 1 && !('operator' in cd.conditions[0])) {
    const sc = cd.conditions[0] as SingleConditionDef;
    return {
      type: sc.type as SingleCondition['type'],
      operator: sc.operator as SingleCondition['operator'],
      left: sc.left,
      right: sc.right,
    } as SingleCondition;
  }

  return {
    operator: cd.operator,
    conditions: cd.conditions.map((c) => {
      if ('operator' in c) {
        return deserializeCondition(c as ConditionGroupDef);
      }
      const sc = c as SingleConditionDef;
      return {
        type: sc.type as SingleCondition['type'],
        operator: sc.operator as SingleCondition['operator'],
        left: sc.left,
        right: sc.right,
      } as SingleCondition;
    }),
  } as ConditionGroup;
}

function deserializeView(vd: ViewDefinitionDef): View {
  return {
    type: vd.type as View['type'],
    config: {
      background: vd.config?.background,
      layout: vd.config?.layout as View['config']['layout'],
      elements: vd.config?.elements as ViewElement[],
      interactive: vd.config?.interactive,
    },
  };
}

function deserializeVariable(vd: VariableDefinitionDef): VariableDefinition {
  return {
    name: vd.name,
    type: vd.type as VariableDefinition['type'],
    defaultValue: vd.defaultValue,
    scope: vd.scope as VariableDefinition['scope'],
  };
}

// ==================== JSON Validator ====================

export function validateScenarioJson(json: any): JsonValidationResult {
  const errors: JsonValidationError[] = [];
  const warnings: JsonValidationWarning[] = [];

  // 1. Проверка версии
  if (!json.version || typeof json.version !== 'string') {
    errors.push({ path: 'version', message: 'Отсутствует или невалидная версия', severity: 'error' });
  }

  // 2. Проверка метаданных
  if (!json.metadata) {
    errors.push({ path: 'metadata', message: 'Отсутствуют метаданные', severity: 'error' });
  } else {
    if (!json.metadata.id) errors.push({ path: 'metadata.id', message: 'Отсутствует ID сценария', severity: 'error' });
    if (!json.metadata.name) errors.push({ path: 'metadata.name', message: 'Отсутствует название', severity: 'error' });
    if (!json.metadata.authorId) errors.push({ path: 'metadata.authorId', message: 'Отсутствует автор', severity: 'error' });
  }

  // 3. Проверка сцен
  if (!Array.isArray(json.scenes)) {
    errors.push({ path: 'scenes', message: 'Сцены должны быть массивом', severity: 'error' });
  } else {
    const sceneIds = new Set<string>();

    for (let i = 0; i < json.scenes.length; i++) {
      const scene = json.scenes[i];
      const prefix = `scenes[${i}]`;

      if (!scene.id) {
        errors.push({ path: `${prefix}.id`, message: `Сцена ${i}: отсутствует ID`, severity: 'error' });
      } else {
        if (sceneIds.has(scene.id)) {
          errors.push({ path: `${prefix}.id`, message: `Сцена ${i}: дубликат ID "${scene.id}"`, severity: 'error' });
        }
        sceneIds.add(scene.id);
      }

      if (!scene.title) {
        warnings.push({ path: `${prefix}.title`, message: `Сцена ${i}: отсутствует название` });
      }

      if (!scene.type) {
        errors.push({ path: `${prefix}.type`, message: `Сцена ${i}: отсутствует тип`, severity: 'error' });
      }

      // Проверка миссий
      if (Array.isArray(scene.missions)) {
        for (let j = 0; j < scene.missions.length; j++) {
          const mission = scene.missions[j];
          const mPrefix = `${prefix}.missions[${j}]`;

          if (!mission.id) {
            errors.push({ path: `${mPrefix}.id`, message: `Миссия ${j} сцены ${i}: отсутствует ID`, severity: 'error' });
          }
          if (!mission.type) {
            errors.push({ path: `${mPrefix}.type`, message: `Миссия ${j} сцены ${i}: отсутствует тип`, severity: 'error' });
          }
        }
      }

      // Проверка переходов
      if (Array.isArray(scene.transitions)) {
        for (let j = 0; j < scene.transitions.length; j++) {
          const t = scene.transitions[j];
          const tPrefix = `${prefix}.transitions[${j}]`;

          if (!t.from) {
            errors.push({ path: `${tPrefix}.from`, message: `Переход ${j} сцены ${i}: отсутствует from`, severity: 'error' });
          }
          if (!t.to) {
            errors.push({ path: `${tPrefix}.to`, message: `Переход ${j} сцены ${i}: отсутствует to`, severity: 'error' });
          }
        }
      }
    }

    // Проверка ссылок (переходы ведут к существующим сценам)
    for (let i = 0; i < json.scenes.length; i++) {
      const scene = json.scenes[i];
      if (Array.isArray(scene.transitions)) {
        for (let j = 0; j < scene.transitions.length; j++) {
          const t = scene.transitions[j];
          if (t.to && !sceneIds.has(t.to)) {
            warnings.push({
              path: `scenes[${i}].transitions[${j}].to`,
              message: `Переход ведёт к несуществующей сцене "${t.to}"`,
            });
          }
        }
      }
    }
  }

  // 4. Проверка переменных
  if (json.variables && !Array.isArray(json.variables)) {
    errors.push({ path: 'variables', message: 'Переменные должны быть массивом', severity: 'error' });
  }

  // 5. Проверка наград
  if (json.rewards && !Array.isArray(json.rewards)) {
    errors.push({ path: 'rewards', message: 'Награды должны быть массивом', severity: 'error' });
  }

  // 6. Проверка триггеров
  if (json.triggers && !Array.isArray(json.triggers)) {
    errors.push({ path: 'triggers', message: 'Триггеры должны быть массивом', severity: 'error' });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==================== Migration Runner ====================

export function migrateScenario(json: any, targetVersion: string = '1.0'): any {
  let currentVersion = json.version || '1.0';
  let data = { ...json };

  const applicableMigrations = migrations.filter(
    (m) => m.from === currentVersion && compareVersions(m.to, targetVersion) <= 0
  );

  for (const migration of applicableMigrations) {
    data = migration.migrate(data);
    currentVersion = migration.to;
  }

  data.version = targetVersion;
  return data;
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ==================== Utility: Export/Import ====================

export function exportScenarioToJson(scenario: Scenario): string {
  const definition = serializeScenario(scenario);
  return JSON.stringify(definition, null, 2);
}

export function importScenarioFromJson(jsonString: string): { scenario: Partial<Scenario>; edges: Edge[]; validation: JsonValidationResult } {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      scenario: {},
      edges: [],
      validation: {
        valid: false,
        errors: [{ path: 'root', message: `Ошибка парсинга JSON: ${(e as Error).message}`, severity: 'error' }],
        warnings: [],
      },
    };
  }

  // Миграция до актуальной версии
  const migrated = migrateScenario(parsed, '1.0');

  // Валидация
  const validation = validateScenarioJson(migrated);

  if (!validation.valid) {
    return { scenario: {}, edges: [], validation };
  }

  // Десериализация
  const result = deserializeScenario(migrated as ScenarioDefinition);

  return { scenario: result.scenario, edges: result.edges, validation };
}