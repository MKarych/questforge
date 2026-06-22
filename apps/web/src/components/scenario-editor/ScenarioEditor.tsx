'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { ScenarioNodeData, NodeType, BLOCK_TYPES, BlockType, ValidationResult } from '@/types/scenario';
import BlockPalette from './BlockPalette';
import NodeSettings from './NodeSettings';
import ScenarioNode from './ScenarioNode';

const nodeTypes = {
  START: ScenarioNode,
  FINISH: ScenarioNode,
  TEXT: ScenarioNode,
  CODE: ScenarioNode,
  PHOTO: ScenarioNode,
  GPS: ScenarioNode,
  QR: ScenarioNode,
  CHOICE: ScenarioNode,
  TIMER: ScenarioNode,
  BRANCH: ScenarioNode,
  NPC: ScenarioNode,
};

interface ScenarioEditorProps {
  scenarioName?: string;
  onSave?: (data: any) => void;
}

export default function ScenarioEditor({ scenarioName, onSave }: ScenarioEditorProps) {
  const [name, setName] = useState(scenarioName || 'Новый сценарий');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<ScenarioNodeData> | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationResult>({ valid: true, errors: [] });

  // Initialize with START and FINISH nodes
  useState(() => {
    if (nodes.length === 0) {
      const startId = uuidv4();
      const finishId = uuidv4();
      
      setNodes([
        {
          id: startId,
          type: 'START',
          position: { x: 400, y: 50 },
          data: { label: 'Старт', icon: '🚀' },
        },
        {
          id: finishId,
          type: 'FINISH',
          position: { x: 400, y: 400 },
          data: { label: 'Финиш', icon: '🏁' },
        },
      ]);
    }
  });

  const onDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData('application/reactflow', blockType.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      const block = BLOCK_TYPES.find((b) => b.type === type);

      if (!block) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newNode: Node<ScenarioNodeData> = {
        id: uuidv4(),
        type,
        position,
        data: {
          label: block.label,
          icon: block.icon,
          question: '',
          answer: '',
          hint: '',
          points: 10,
          penalty: 0,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<ScenarioNodeData>);
    },
    []
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: ScenarioNodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const validateScenario = useCallback((): ValidationResult => {
    const errors: ValidationResult['errors'] = [];

    // Check for START node
    const startNodes = nodes.filter((n) => n.type === 'START');
    if (startNodes.length === 0) {
      errors.push({
        code: 'ERR_NO_START',
        message: 'Сценарий должен иметь узел START',
        severity: 'error',
      });
    } else if (startNodes.length > 1) {
      errors.push({
        code: 'ERR_MULTIPLE_START',
        message: 'Сценарий не может иметь более одного узла START',
        severity: 'error',
      });
    }

    // Check for FINISH node
    const finishNodes = nodes.filter((n) => n.type === 'FINISH');
    if (finishNodes.length === 0) {
      errors.push({
        code: 'ERR_NO_FINISH',
        message: 'Сценарий должен иметь узел FINISH',
        severity: 'error',
      });
    }

    // Check for orphan nodes (basic check)
    if (nodes.length > 2 && edges.length === 0) {
      errors.push({
        code: 'ERR_NO_CONNECTIONS',
        message: 'Узлы не соединены между собой',
        severity: 'warning',
      });
    }

    return {
      valid: errors.every((e) => e.severity !== 'error'),
      errors,
    };
  }, [nodes, edges]);

  const handleSave = useCallback(() => {
    const validation = validateScenario();
    setValidationErrors(validation);

    if (validation.valid && onSave) {
      onSave({
        name,
        nodes,
        edges,
        startNodeId: nodes.find((n) => n.type === 'START')?.id,
      });
    }
  }, [name, nodes, edges, onSave, validateScenario]);

  const startNodeId = useMemo(
    () => nodes.find((n) => n.type === 'START')?.id || '',
    [nodes]
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/30 rounded px-2 py-1"
          />
          {startNodeId && (
            <span className="text-xs text-text-secondary bg-primary/10 px-2 py-1 rounded">
              ID: {startNodeId.slice(0, 8)}...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const validation = validateScenario();
              setValidationErrors(validation);
              alert(validation.valid ? '✅ Валидация пройдена!' : `❌ Ошибок: ${validation.errors.length}`);
            }}
            className="btn-secondary text-sm"
            title="Проверить сценарий (Ctrl+Enter)"
          >
            ✅ Проверить
          </button>
          <button className="btn-secondary text-sm" title="Превью (Ctrl+P)">
            👁 Превью
          </button>
          <button onClick={handleSave} className="btn-primary text-sm">
            💾 Сохранить
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {!validationErrors.valid && validationErrors.errors.length > 0 && (
        <div className="bg-error/10 border-b border-error/30 px-4 py-2">
          <div className="flex items-center gap-2 text-error text-sm">
            <span>⚠️</span>
            <span>
              {validationErrors.errors.filter((e) => e.severity === 'error').length} ошибок,{' '}
              {validationErrors.errors.filter((e) => e.severity === 'warning').length} предупреждений
            </span>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex">
        {/* Block Palette */}
        <BlockPalette onDragStart={onDragStart} />

        {/* Canvas */}
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-background"
          >
            <Background color="#888" gap={20} />
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                const block = BLOCK_TYPES.find((b) => b.type === n.type);
                return block ? block.color.replace('bg-', 'border-') : '#888';
              }}
              nodeColor={(n) => {
                const block = BLOCK_TYPES.find((b) => b.type === n.type);
                return block ? `#${block.color.split('-')[1]}20` : '#eee';
              }}
              nodeBorderRadius={8}
            />
          </ReactFlow>
        </div>

        {/* Node Settings Panel */}
        {selectedNode && (
          <NodeSettings
            node={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
