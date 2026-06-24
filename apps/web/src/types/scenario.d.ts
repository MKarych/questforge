import { Node, Edge } from 'reactflow';
export type NodeType = 'START' | 'FINISH' | 'TEXT' | 'CODE' | 'PHOTO' | 'GPS' | 'QR' | 'CHOICE' | 'TIMER' | 'BRANCH' | 'NPC' | 'AR';
export type EdgeConditionType = 'success' | 'fail' | 'timeout' | 'always' | 'custom';
export interface EdgeCondition {
    type: EdgeConditionType;
    label: string;
    expression?: string;
}
export interface ScenarioNodeData {
    label: string;
    icon?: string;
    question?: string;
    answer?: string;
    hint?: string;
    textAnswer?: string;
    code?: string;
    attempts?: number;
    photoRequirements?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    radius?: number;
    qrData?: string;
    options?: string[];
    correctOption?: number;
    duration?: number;
    branches?: Array<{
        label: string;
        target: string;
        condition?: EdgeCondition;
    }>;
    npcName?: string;
    npcDescription?: string;
    npcDialogues?: Array<{
        npcText: string;
        options: Array<{
            text: string;
            target: string;
        }>;
    }>;
    arModelUrl?: string;
    arAction?: string;
    arTrigger?: string;
    points?: number;
    penalty?: number;
    validationStatus?: 'error' | 'blocked' | 'ok';
    validationMessage?: string;
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
    totalTime?: number;
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
export declare const BLOCK_TYPES: BlockType[];
export interface BlockCategory {
    name: string;
    blocks: NodeType[];
}
export declare const BLOCK_CATEGORIES: BlockCategory[];
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
//# sourceMappingURL=scenario.d.ts.map