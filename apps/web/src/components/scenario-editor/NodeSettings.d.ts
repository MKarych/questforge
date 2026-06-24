import { Node } from 'reactflow';
import { ScenarioNodeData } from '@/types/scenario';
interface NodeSettingsProps {
    node: Node<ScenarioNodeData> | null;
    allNodes: Node<ScenarioNodeData>[];
    onUpdate: (nodeId: string, data: ScenarioNodeData) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
}
export default function NodeSettings({ node, allNodes, onUpdate, onDelete, onClose }: NodeSettingsProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=NodeSettings.d.ts.map