// ============================================================
// Editor v2 — Полная система типов по спецификациям 49, 50, 51
// ============================================================

// ==================== 1. Core Runtime Primitives (spec 49.1.2) ====================

// 1.2.1. Scene (Сцена)
export type SceneType = 'location' | 'quiz' | 'dialogue' | 'game' | 'slide' | 'custom';

export interface Scene {
  id: string;
  type: SceneType;
  title: string;
  description: string;
  view: View;
  missions: Mission[];
  transitions: Transition[];
  position: { x: number; y: number };
  metadata: {
    gps?: { lat: number; lng: number; radius: number };
    timer?: number;
    requiredRole?: string;
    conditions?: Condition[];
  };
}

// 1.2.2. Action (Действие)
export type ActionType = 'text' | 'click' | 'choice' | 'photo' | 'gps' | 'qr' | 'code' | 'drag' | 'collect' | 'dialogue';

export interface Action {
  id: string;
  type: ActionType;
  label: string;
  config: ActionConfig;
  conditions: Condition[];
  rewards: Reward[];
}

export type ActionConfig = Record<string, any>;

// 1.2.3. State (Состояние)
export interface GameState {
  variables: Record<string, any>;
  inventory: InventoryItem[];
  score: number;
  flags: Record<string, boolean>;
  progress: {
    completedScenes: string[];
    currentSceneId: string;
    totalScenes: number;
  };
}

// 1.2.4. Condition (Условие) — AST
export type ConditionType = 'variable' | 'score' | 'inventory' | 'flag' | 'role' | 'time' | 'random';

export type Operator =
  | 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte'
  | 'contains' | 'has';

export interface SingleCondition {
  type: ConditionType;
  operator: Operator;
  left: string | number | boolean;
  right: string | number | boolean;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (SingleCondition | ConditionGroup)[];
}

export type Condition = SingleCondition | ConditionGroup;

// 1.2.5. Event (Событие)
export type EventType =
  | 'onClick' | 'onAnswer' | 'onTimer' | 'onComplete'
  | 'onAchievement' | 'onEnter' | 'onExit';

export interface GameEvent {
  type: EventType;
  actions: Action[];
}

// 1.2.6. View (Представление)
export type ViewType = 'map' | 'list' | 'card' | 'grid' | 'slide' | 'timeline' | 'canvas';

export interface View {
  type: ViewType;
  config: {
    background?: string;
    layout?: 'vertical' | 'horizontal' | 'grid' | 'free';
    elements?: ViewElement[];
    interactive?: boolean;
  };
}

export interface ViewElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'input' | 'map' | 'video';
  content: any;
  position?: { x: number; y: number };
}

// ==================== 3.1. Scenario (spec 49.3.1) ====================
export type ScenarioStatus =
  | 'draft'
  | 'saved'
  | 'testing'
  | 'pending'
  | 'published'
  | 'updated'
  | 'archived'
  | 'deleted';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  version: number;
  scenes: Scene[];
  startSceneId: string;
  variables: VariableDefinition[];
  metadata: ScenarioMetadata;
  status: ScenarioStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ScenarioMetadata {
  settings: GameSettings;
  tags?: string[];
  coverImage?: string;
  marketplace?: MarketplaceInfo;
  authorId?: string;
  city?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MarketplaceInfo {
  price: number;
  licenseType: LicenseType;
  demo: boolean;
  screenshots: string[];
}

export type LicenseType =
  | 'single'
  | 'multi_city'
  | 'commercial'
  | 'white_label';

// ==================== 3.2. Scene (alias EditorNode for backward compat) ====================
/** @deprecated Use Scene instead */
export type NodeType = SceneType;

/** @deprecated Use Scene instead */
export interface EditorNode extends Scene {
  // EditorNode is now an alias of Scene
}

// ==================== 3.3. Mission (spec 49.3.3) ====================
export type MissionType =
  | 'text' | 'code' | 'photo' | 'gps' | 'qr'
  | 'choice' | 'collect' | 'dialogue'
  | 'audio' | 'video' | 'image'
  | 'inventory_get' | 'inventory_spend' | 'inventory_check'
  | 'achievement';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  config: MissionConfig;
  rewards: Reward[];
  conditions: Condition[];
  hints: Hint[];
}

export type MissionConfig =
  | TextMissionConfig
  | CodeMissionConfig
  | PhotoMissionConfig
  | GpsMissionConfig
  | QrMissionConfig
  | ChoiceMissionConfig
  | CollectMissionConfig
  | DialogueMissionConfig
  | AudioMissionConfig
  | VideoMissionConfig
  | ImageMissionConfig
  | InventoryGetMissionConfig
  | InventorySpendMissionConfig
  | InventoryCheckMissionConfig
  | AchievementMissionConfig;

export interface TextMissionConfig {
  correctAnswer: string;
  matchMode: 'exact' | 'regex' | 'case_insensitive';
  maxAttempts: number;
  points?: number;
  penalty?: number;
}

export interface CodeMissionConfig {
  correctCode: string;
  maxAttempts: number;
  points?: number;
  penalty?: number;
}

export interface PhotoMissionConfig {
  requirements: string;
  validationType: 'manual' | 'ai';
  points?: number;
  penalty?: number;
}

export interface GpsMissionConfig {
  lat: number;
  lng: number;
  radius: number;
  points?: number;
  penalty?: number;
}

export interface QrMissionConfig {
  data: string;
  points?: number;
  penalty?: number;
}

export interface ChoiceMissionConfig {
  options: string[];
  correctIndex: number;
  shuffle: boolean;
  points?: number;
  penalty?: number;
}

export interface CollectMissionConfig {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface DialogueMissionConfig {
  npcName: string;
  npcDescription: string;
  dialogues: DialogueEntry[];
}

export interface DialogueEntry {
  npcText: string;
  options: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  targetSceneId: string;
  condition?: Condition;
}

export interface AudioMissionConfig {
  assetId: string;
  autoPlay: boolean;
  loop: boolean;
  points?: number;
  penalty?: number;
}

export interface VideoMissionConfig {
  assetId: string;
  autoPlay: boolean;
  loop: boolean;
  points?: number;
  penalty?: number;
}

export interface ImageMissionConfig {
  assetId: string;
  caption?: string;
  points?: number;
  penalty?: number;
}

export interface InventoryGetMissionConfig {
  itemId: string;
  itemName: string;
  quantity: number;
  points?: number;
  penalty?: number;
}

export interface InventorySpendMissionConfig {
  itemId: string;
  itemName: string;
  quantity: number;
  points?: number;
  penalty?: number;
}

export interface InventoryCheckMissionConfig {
  itemId: string;
  itemName: string;
  quantity: number;
  consumeOnCheck: boolean;
  points?: number;
  penalty?: number;
}

export interface AchievementMissionConfig {
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  icon?: string;
  points?: number;
  penalty?: number;
}

// ==================== Transition (spec 50.3.3) ====================
export type TransitionType = 'manual' | 'auto' | 'conditional' | 'random';

export interface Transition {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  condition: Condition;
  type: TransitionType;
  label?: string;
}

// ==================== 4. Variables (spec 49.11) ====================
export interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  scope: 'local' | 'global';
}

export interface AuthorAchievementData {
  id: string;
  unlockedAt: number;
}

// ==================== Editor State ====================
export type VariableOperation =
  | 'set' | 'add' | 'subtract' | 'multiply' | 'divide'
  | 'increment' | 'decrement';

// ==================== 5. Reward Engine (spec 50.5) ====================
export type RewardType =
  | 'score' | 'money' | 'item' | 'achievement' | 'variable' | 'experience';

export interface Reward {
  type: RewardType;
  target: 'team' | 'player' | 'all';
  value: any;
  message?: string;
}

// ==================== Hint ====================
export interface Hint {
  id: string;
  text: string;
  penalty?: number;
  order: number;
}

// ==================== Inventory (spec 49.12) ====================
export type ItemType = 'key' | 'consumable' | 'currency' | 'quest' | 'weapon' | 'armor';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  icon: string;
  effects: ItemEffect[];
}

export interface ItemEffect {
  type: string;
  value: any;
}

export interface Inventory {
  items: InventoryItem[];
  capacity: number;
}

// ==================== Achievement (spec 49.14) ====================
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: Condition;
}

// ==================== Game Settings ====================
export interface GameSettings {
  totalTime: number;
  defaultPoints: number;
  defaultPenalty: number;
  hintLimit: number;
  maxAttempts: number;
  variables: VariableDefinition[];
}

// ==================== 7. Editor State (spec 49.7.2) ====================
export interface EditorState {
  scenarioId: string | null;
  version: number;
  lastSavedAt: Date | null;
  isDirty: boolean;

  // Scenario data
  name: string;
  description: string;
  scenes: Scene[];
  edges: Edge[];
  variables: VariableDefinition[];
  settings: GameSettings;

  // Canvas
  viewport: { x: number; y: number; zoom: number };
  selectedNodes: string[];
  selectedEdges: string[];

  // History
  history: {
    undoStack: EditorSnapshot[];
    redoStack: EditorSnapshot[];
    maxHistory: number;
  };

  // Clipboard
  clipboard: { scenes: Scene[]; edges: Edge[] } | null;

  // Panels
  openPanels: {
    properties: boolean;
    variables: boolean;
    validation: boolean;
    debugger: boolean;
  };

  // Validation
  validationResult: ValidationResult;

  // UI State
  mode: 'edit' | 'preview' | 'test';
  previewSceneId: string | null;
  testState: TestState | null;

  // UX features
  showTemplates: boolean;
  showAIAssistant: boolean;
  showAiEnhance: boolean;
  showToolbarSettings: boolean;
  livePreviewSceneId: string | null;
  authorAchievements: AuthorAchievementData[];
  newAchievementAlerts: AuthorAchievementData[];

  // Toolbar settings
  toolbarSettings: ToolbarSettings;

  // Flow key for ReactFlow remounting
  flowKey: number;
}

export type ToolbarSize = 'small' | 'medium' | 'large';
export type ToolbarDisplay = 'icon' | 'icon_label' | 'label';

export interface ToolbarSettings {
  size: ToolbarSize;
  display: ToolbarDisplay;
}

export interface EditorSnapshot {
  scenes: Scene[];
  edges: Edge[];
  variables: VariableDefinition[];
  timestamp: number;
}

// ==================== Edge ====================
export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  data?: {
    condition?: Condition;
    label?: string;
    transitionType?: TransitionType;
  };
}

// ==================== Validation ====================
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  sceneId?: string;
  missionId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  sceneId?: string;
  message: string;
}

// ==================== Test State ====================
export interface TestState {
  currentSceneId: string | null;
  variables: Record<string, any>;
  score: number;
  inventory: Inventory;
  achievements: string[];
  log: TestLogEntry[];
  finished: boolean;
}

export interface TestLogEntry {
  type: 'info' | 'success' | 'fail' | 'reward' | 'transition';
  message: string;
  timestamp: number;
}

// ==================== Block Palette (spec 49.4) ====================
export interface BlockCategory {
  name: string;
  blocks: BlockDefinition[];
}

export interface BlockDefinition {
  type: SceneType;
  label: string;
  icon: string;
  description: string;
  color: string;
  category: string;
  experimental?: boolean;
}

// ==================== Asset Manager ====================
export interface Asset {
  id: string;
  url: string;
  type: 'image' | 'audio' | 'video' | 'map' | 'ar' | 'document';
  name: string;
  size: number;
  createdAt: Date;
}

// ==================== Trigger System (spec 50.6) ====================
export interface Trigger {
  id: string;
  event: string;
  conditions: ConditionGroup;
  actions: Action[];
}

// ==================== Scheduler (spec 50.7) ====================
export type ScheduleType = 'absolute' | 'relative' | 'periodic';

export interface Schedule {
  id: string;
  type: ScheduleType;
  at?: string;
  delay?: number;
  interval?: number;
  action: Action;
}

// ==================== Константы блоков ====================
export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // Базовые
  { type: 'location', label: 'Старт', icon: '🚀', description: 'Начальная сцена', color: 'bg-green-500', category: 'Базовые' },
  { type: 'location', label: 'Финиш', icon: '🏁', description: 'Конечная сцена', color: 'bg-red-500', category: 'Базовые' },
  // Задания
  { type: 'quiz', label: 'Текст', icon: '📝', description: 'Текстовое задание', color: 'bg-blue-500', category: 'Задания' },
  { type: 'quiz', label: 'Код', icon: '🔢', description: 'Ввод кода', color: 'bg-purple-500', category: 'Задания' },
  { type: 'quiz', label: 'Фото', icon: '📷', description: 'Фото-задание', color: 'bg-pink-500', category: 'Задания' },
  { type: 'location', label: 'GPS', icon: '📍', description: 'GPS-локация', color: 'bg-yellow-500', category: 'Задания' },
  { type: 'quiz', label: 'QR', icon: '📱', description: 'QR-код', color: 'bg-indigo-500', category: 'Задания' },
  { type: 'quiz', label: 'Выбор', icon: '🎯', description: 'Выбор варианта', color: 'bg-orange-500', category: 'Задания' },
  // Медиа
  { type: 'slide', label: 'Аудио', icon: '🎵', description: 'Воспроизведение аудио', color: 'bg-purple-400', category: 'Медиа' },
  { type: 'slide', label: 'Видео', icon: '🎬', description: 'Воспроизведение видео', color: 'bg-indigo-400', category: 'Медиа' },
  { type: 'slide', label: 'Изображение', icon: '🖼', description: 'Показ изображения', color: 'bg-pink-400', category: 'Медиа' },
  // Логика
  { type: 'slide', label: 'Таймер', icon: '⏱', description: 'Ограничение по времени', color: 'bg-red-400', category: 'Логика' },
  { type: 'custom', label: 'Ветвление', icon: '🔀', description: 'Ветвление сценария', color: 'bg-teal-500', category: 'Логика' },
  { type: 'custom', label: 'Условие', icon: '⚖️', description: 'Проверка условия', color: 'bg-amber-500', category: 'Логика' },
  // Инвентарь
  { type: 'custom', label: 'Получить предмет', icon: '🎒', description: 'Добавить предмет в инвентарь', color: 'bg-lime-500', category: 'Инвентарь' },
  { type: 'custom', label: 'Потратить предмет', icon: '📦', description: 'Удалить предмет из инвентаря', color: 'bg-orange-400', category: 'Инвентарь' },
  { type: 'custom', label: 'Проверка предмета', icon: '🔍', description: 'Проверить наличие предмета', color: 'bg-cyan-400', category: 'Инвентарь' },
  // Достижения
  { type: 'custom', label: 'Достижение', icon: '🏆', description: 'Выдать достижение', color: 'bg-yellow-400', category: 'Достижения' },
  // Персонажи
  { type: 'dialogue', label: 'NPC', icon: '🗣', description: 'Взаимодействие с персонажем', color: 'bg-cyan-500', category: 'Персонажи' },
  { type: 'dialogue', label: 'Диалог', icon: '💬', description: 'Ветка диалога с NPC', color: 'bg-teal-400', category: 'Персонажи' },
  // Экспериментальные
  { type: 'custom', label: 'AR', icon: '🧩', description: 'Дополненная реальность', color: 'bg-gray-500', category: 'Экспериментальные', experimental: true },
  { type: 'custom', label: 'Битва', icon: '⚔️', description: 'Мини-битва', color: 'bg-red-600', category: 'Экспериментальные', experimental: true },
];

export const BLOCK_CATEGORIES: BlockCategory[] = [
  { name: 'Базовые', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Базовые') },
  { name: 'Задания', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Задания') },
  { name: 'Медиа', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Медиа') },
  { name: 'Логика', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Логика') },
  { name: 'Инвентарь', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Инвентарь') },
  { name: 'Достижения', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Достижения') },
  { name: 'Персонажи', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Персонажи') },
  { name: 'Экспериментальные', blocks: BLOCK_DEFINITIONS.filter(b => b.category === 'Экспериментальные') },
];

// ==================== Системные переменные (spec 49.11.1) ====================
export const SYSTEM_VARIABLES: VariableDefinition[] = [
  { name: 'team.name', type: 'string', defaultValue: '', scope: 'global' },
  { name: 'team.score', type: 'number', defaultValue: 0, scope: 'global' },
  { name: 'team.members', type: 'number', defaultValue: 0, scope: 'global' },
  { name: 'player.name', type: 'string', defaultValue: '', scope: 'local' },
  { name: 'player.role', type: 'string', defaultValue: 'member', scope: 'local' },
  { name: 'game.time', type: 'number', defaultValue: 0, scope: 'global' },
  { name: 'game.elapsed', type: 'number', defaultValue: 0, scope: 'global' },
  { name: 'game.currentScene', type: 'string', defaultValue: '', scope: 'global' },
  { name: 'game.totalScenes', type: 'number', defaultValue: 0, scope: 'global' },
];