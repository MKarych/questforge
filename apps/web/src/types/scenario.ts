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
  | 'NPC';

export interface ScenarioNodeData {
  label: string;
  icon?: string;
  question?: string;
  answer?: string;
  hint?: string;
  options?: string[];
  code?: string;
  attempts?: number;
  photoRequirements?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number;
  qrData?: string;
  duration?: number;
  branches?: Array<{ condition: string; target: string }>;
  npcName?: string;
  npcDialogue?: string;
  points?: number;
  penalty?: number;
  timeout?: number;
}

export type ScenarioNode = Node<ScenarioNodeData, NodeType>;
export type ScenarioEdge = Edge;

export interface Scenario {
  id?: string;
  name: string;
  description: string;
  nodes: ScenarioNode[];
  edges: ScenarioEdge[];
  startNodeId: string;
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
