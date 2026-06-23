import { Node, Edge } from 'reactflow';

export type NodeType =
  | 'START'
  | 'FINISH'
  | 'TEXT'
  | 'CODE'
  | 'PHOTO'
  | 'GPS'
  | 'QR'
  | 'CHOICE'
  | 'TIMER'
  | 'BRANCH'
  | 'NPC'
  | 'AR';

export type EdgeConditionType = 'success' | 'fail' | 'timeout' | 'always' | 'custom';

export interface EdgeCondition {
  type: EdgeConditionType;
  label: string;
  expression?: string; // for custom conditions, e.g. "score > 10"
}

export interface ScenarioNodeData {
  label: string;
  icon?: string;
  // Common fields
  question?: string;
  answer?: string;
  hint?: string;
  // TEXT
  textAnswer?: string;
  // CODE
  code?: string;
  attempts?: number;
  // PHOTO
  photoRequirements?: string;
  // GPS
  coordinates?: { lat: number; lng: number };
  radius?: number;
  // QR
  qrData?: string;
  // CHOICE
  options?: string[];
  correctOption?: number;
  // TIMER
  duration?: number;
  // BRANCH
  branches?: Array<{ label: string; target: string; condition?: EdgeCondition }>;
  // NPC
  npcName?: string;
  npcDescription?: string;
  npcDialogues?: Array<{ npcText: string; options: Array<{ text: string; target: string }> }>;
  // General
  points?: number;
  penalty?: number;
}

export type ScenarioNode = Node<ScenarioNodeData, NodeType>;

export type ScenarioEdge = Edge & {
  data?: {
    condition?: EdgeCondition;
  };
};

export interface ScenarioVariable {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean';
  defaultValue: number | string | boolean;
  description?: string;
}

export interface GameSettings {
  totalTime?: number; // minutes, 0 = unlimited
  defaultPoints: number;
  defaultPenalty: number;
  hintLimit: number;
  maxAttempts: number;
  variables: ScenarioVariable[];
}

export interface Scenario {
  id?: string;
  name: string;
  description: string;
  nodes: ScenarioNode[];
  edges: ScenarioEdge[];
  startNodeId: string;
  settings?: GameSettings;
  publishedAt?: string;
}

export interface BlockType {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const BLOCK_TYPES: BlockType[] = [
  { type: 'START', label: 'Старт', icon: '🚀', description: 'Начало сценария', color: 'bg-green-500' },
  { type: 'FINISH', label: 'Финиш', icon: '🏁', description: 'Конец сценария', color: 'bg-red-500' },
  { type: 'TEXT', label: 'Текст', icon: '📝', description: 'Текстовое задание', color: 'bg-blue-500' },
  { type: 'CODE', label: 'Код', icon: '🔢', description: 'Ввод кода', color: 'bg-purple-500' },
  { type: 'PHOTO', label: 'Фото', icon: '📷', description: 'Фото-задание', color: 'bg-pink-500' },
  { type: 'GPS', label: 'GPS', icon: '📍', description: 'GPS-локация', color: 'bg-yellow-500' },
  { type: 'QR', label: 'QR', icon: '📱', description: 'QR-код', color: 'bg-indigo-500' },
  { type: 'CHOICE', label: 'Выбор', icon: '🎯', description: 'Выбор варианта', color: 'bg-orange-500' },
  { type: 'TIMER', label: 'Таймер', icon: '⏱', description: 'Ограничение по времени', color: 'bg-red-400' },
  { type: 'BRANCH', label: 'Ветвление', icon: '🔀', description: 'Ветвление сценария', color: 'bg-teal-500' },
  { type: 'NPC', label: 'NPC', icon: '🗣', description: 'Взаимодействие с персонажем', color: 'bg-cyan-500' },
  { type: 'AR', label: 'AR', icon: '🧩', description: 'Дополненная реальность', color: 'bg-gray-500' },
];

// Block categories for palette grouping
export interface BlockCategory {
  name: string;
  blocks: NodeType[];
}

export const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    name: 'Базовые',
    blocks: ['START', 'FINISH'],
  },
  {
    name: 'Задания',
    blocks: ['TEXT', 'CODE', 'PHOTO', 'GPS', 'QR', 'CHOICE'],
  },
  {
    name: 'Логика',
    blocks: ['TIMER', 'BRANCH'],
  },
  {
    name: 'Персонажи',
    blocks: ['NPC'],
  },
  {
    name: 'Экспериментальные',
    blocks: ['AR'],
  },
];

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  nodeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface HistoryAction {
  type: 'add' | 'remove' | 'update' | 'connect' | 'disconnect' | 'copy' | 'paste';
  nodeId?: string;
  edgeId?: string;
  previousState?: any;
  currentState?: any;
}
