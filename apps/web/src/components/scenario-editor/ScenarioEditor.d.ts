import { Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { ScenarioNodeData, GameSettings } from '@/types/scenario';
interface ScenarioEditorProps {
    scenarioName?: string;
    initialNodes?: Node<ScenarioNodeData>[];
    initialEdges?: Edge[];
    initialSettings?: GameSettings;
    isPublished?: boolean;
    onSave?: (data: any) => void;
    onPublish?: () => void;
    onNodesChange?: () => void;
    onEdgesChange?: () => void;
}
export default function ScenarioEditor(props: ScenarioEditorProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ScenarioEditor.d.ts.map