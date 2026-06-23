'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
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

interface HistoryState {
  nodes: Node<ScenarioNodeData>[];
  edges: Edge[];
  action: string;
  nodeId?: string;
  edgeId?: string;
  timestamp: number;
}

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
  const [showPreview, setShowPreview] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copiedNode, setCopiedNode] = useState<Node<ScenarioNodeData> | null>(null);
  const [currentPreviewNode, setCurrentPreviewNode] = useState<string | null>(null);

  // Initialize with START and FINISH nodes
  useEffect(() => {
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
  }, []);

  // Save history state
  const saveHistory = useCallback((actionType: string, nodeId?: string, edgeId?: string) => {
    const state = {
      nodes,
      edges,
      action: actionType,
      nodeId,
      edgeId,
      timestamp: Date.now(),
    };

    // Remove future history if we're not at the end
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }

    setHistory([...history, state]);
    setHistoryIndex(history.length);
  }, [nodes, edges, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          e.preventDefault();
          deleteNode(selectedNode.id);
        }
      }

      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z - Redo
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (selectedNode) {
          setCopiedNode(selectedNode);
        }
      }

      // Ctrl+V - Paste
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (copiedNode) {
          pasteNode(copiedNode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, historyIndex, history, copiedNode, undo, redo]);

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
          hint: '',
          points: 10,
          penalty: 0,
        },
      };

      saveHistory('add', newNode.id);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, saveHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        saveHistory('connect', params.source, params.target);
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges, saveHistory]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<ScenarioNodeData>);
    },
    []
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: ScenarioNodeData) => {
      saveHistory('update', nodeId);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    },
    [setNodes, saveHistory]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      saveHistory('remove', nodeId);
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges, saveHistory]
  );

  const pasteNode = useCallback(
    (nodeToCopy: Node<ScenarioNodeData>) => {
      const newNode: Node<ScenarioNodeData> = {
        ...nodeToCopy,
        id: uuidv4(),
        position: {
          x: nodeToCopy.position.x + 50,
          y: nodeToCopy.position.y + 50,
        },
      };

      saveHistory('paste', newNode.id);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, saveHistory]
  );

  // Improved validation
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

    // Check for orphan nodes (using BFS)
    const graph = new Map<string, string[]>();
    nodes.forEach((node) => graph.set(node.id, []));
    edges.forEach((edge) => {
      const targets = graph.get(edge.source) || [];
      targets.push(edge.target);
      graph.set(edge.source, targets);
    });

    const reachable = new Set<string>();
    const startNode = nodes.find((n) => n.type === 'START');
    
    if (startNode) {
      const queue = [startNode.id];
      reachable.add(startNode.id);
      
      while (queue.length > 0) {
        const current = queue.shift();
        const targets = graph.get(current || '');
        if (targets) {
          targets.forEach((target) => {
            if (!reachable.has(target)) {
              reachable.add(target);
              queue.push(target);
            }
          });
        }
      }
    }

    const orphanNodes = nodes.filter((n) => !reachable.has(n.id));
    for (const node of orphanNodes) {
      errors.push({
        code: 'ERR_ORPHAN_NODE',
        nodeId: node.id,
        message: `Узел "${node.data.label}" недостижим из START`,
        severity: 'warning',
      });
    }

    // Check for cycles (using DFS)
    const hasCycle = (nodeId: string, visited: Set<string>, recStack: Set<string>): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const targets = graph.get(nodeId) || [];
      for (const target of targets) {
        if (!visited.has(target)) {
          if (hasCycle(target, visited, recStack)) {
            return true;
          }
        } else if (recStack.has(target)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    if (startNode && hasCycle(startNode.id, new Set<string>(), new Set<string>())) {
      errors.push({
        code: 'ERR_INFINITE_LOOP',
        message: 'Сценарий содержит бесконечный цикл',
        severity: 'error',
      });
    }

    // Check required fields for each node type
    nodes.forEach((node) => {
      if (node.type === 'TEXT' && !node.data.textAnswer) {
        errors.push({
          code: 'ERR_MISSING_TEXT_ANSWER',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (TEXT) должен иметь правильный ответ`,
          severity: 'error',
        });
      }

      if (node.type === 'CODE' && !node.data.code) {
        errors.push({
          code: 'ERR_MISSING_CODE',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (CODE) должен иметь правильный код`,
          severity: 'error',
        });
      }

      if (node.type === 'GPS' && (!node.data.coordinates?.lat || !node.data.coordinates?.lng)) {
        errors.push({
          code: 'ERR_MISSING_COORDINATES',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (GPS) должен иметь координаты`,
          severity: 'error',
        });
      }

      if (node.type === 'QR' && !node.data.qrData) {
        errors.push({
          code: 'ERR_MISSING_QR_DATA',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (QR) должен иметь данные QR-кода`,
          severity: 'error',
        });
      }

      if (node.type === 'CHOICE' && (!node.data.options || node.data.options.length < 2)) {
        errors.push({
          code: 'ERR_MISSING_OPTIONS',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (CHOICE) должен иметь минимум 2 варианта ответа`,
          severity: 'error',
        });
      }

      if (node.type === 'CHOICE' && node.data.correctOption === undefined) {
        errors.push({
          code: 'ERR_MISSING_CORRECT_OPTION',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (CHOICE) должен иметь правильный вариант`,
          severity: 'error',
        });
      }

      if (node.type === 'TIMER' && !node.data.duration) {
        errors.push({
          code: 'ERR_MISSING_DURATION',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (TIMER) должен иметь длительность`,
          severity: 'error',
        });
      }

      if (node.type === 'NPC' && !node.data.npcName) {
        errors.push({
          code: 'ERR_MISSING_NPC_NAME',
          nodeId: node.id,
          message: `Узел "${node.data.label}" (NPC) должен иметь имя персонажа`,
          severity: 'error',
        });
      }
    });

    // Check for disconnected edges
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

  // Preview handler
  const handlePreviewNode = (nodeId: string) => {
    setCurrentPreviewNode(nodeId);
    setShowPreview(true);
  };

  // Test mode handler
  const handleTestStart = () => {
    setShowTest(true);
  };

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
            placeholder="Название сценария"
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
          <button 
            onClick={() => handlePreviewNode(startNodeId)} 
            className="btn-secondary text-sm"
            title="Превью игры (Ctrl+P)"
          >
            👁 Превью
          </button>
          <button 
            onClick={handleTestStart} 
            className="btn-secondary text-sm"
            title="Тестирование сценария"
          >
            🎮 Тест
          </button>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="btn-secondary text-sm disabled:opacity-30"
            title="Отменить (Ctrl+Z)"
          >
            ↩️ Отменить
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="btn-secondary text-sm disabled:opacity-30"
            title="Повторить (Ctrl+Shift+Z)"
          >
            ↪️ Повторить
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

      {/* Preview Modal */}
      {showPreview && currentPreviewNode && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400">Preview Mode</div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-4 bg-gray-900 flex-1 flex flex-col items-center">
              <div className="text-white text-2xl mb-4">📱 Телефон игрока</div>
              <div className="w-80 h-160 bg-white rounded-xl overflow-hidden shadow-lg flex flex-col">
                {/* Phone Header */}
                <div className="bg-gray-100 p-4 border-b">
                  <div className="text-lg font-bold text-gray-800">{name}</div>
                  <div className="text-sm text-gray-500">Задание {nodes.findIndex(n => n.id === currentPreviewNode) + 1}</div>
                </div>
                {/* Phone Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {(() => {
                    const node = nodes.find(n => n.id === currentPreviewNode);
                    if (!node) return null;
                    return (
                      <div className="space-y-4">
                        <div className="text-xl font-semibold text-gray-800">
                          {node.data.icon} {node.data.label}
                        </div>
                        {node.data.question && (
                          <div className="text-gray-700">
                            {node.data.question}
                          </div>
                        )}
                        {node.data.hint && (
                          <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                            💡 Подсказка: {node.data.hint}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-auto pt-4">
                          Очки: {node.data.points || 0} | Штраф: {node.data.penalty || 0}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => {
                    const nodeIdx = nodes.findIndex(n => n.id === currentPreviewNode);
                    if (nodeIdx > 0) {
                      setCurrentPreviewNode(nodes[nodeIdx - 1].id);
                    }
                  }}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  ← Предыдущее
                </button>
                <button 
                  onClick={() => {
                    const nodeIdx = nodes.findIndex(n => n.id === currentPreviewNode);
                    if (nodeIdx < nodes.length - 1) {
                      const nextNode = nodes[nodeIdx + 1];
                      if (nextNode.type !== 'START' && nextNode.type !== 'FINISH') {
                        setCurrentPreviewNode(nextNode.id);
                      } else if (nodeIdx < nodes.length - 2) {
                        setCurrentPreviewNode(nodes[nodeIdx + 2].id);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Следующее →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Mode Modal */}
      {showTest && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]">
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-white font-semibold">🎮 Тестирование сценария</div>
              <button 
                onClick={() => setShowTest(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                {nodes.map((node, idx) => (
                  node.type !== 'START' && node.type !== 'FINISH' && (
                    <div key={node.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">{node.data.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">{node.data.label}</h3>
                            <span className="text-sm text-gray-400">Задание {idx}</span>
                          </div>
                          {node.data.question && (
                            <p className="text-gray-300 mb-3">{node.data.question}</p>
                          )}
                          {node.data.hint && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded mb-2">
                              <span className="text-yellow-400 text-sm">💡 Подсказка: {node.data.hint}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                            {node.data.points && <span>Очки: +{node.data.points}</span>}
                            {node.data.penalty && <span>Штраф: -{node.data.penalty}</span>}
                            {node.data.duration && <span>Длительность: {node.data.duration}с</span>}
                            {node.data.code && <span>Код: {node.data.code}</span>}
                            {node.data.textAnswer && <span>Ответ: {node.data.textAnswer}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-800 border-t">
              <p className="text-gray-400 text-sm mb-2">
                ⚠️ Это предпросмотр. Для полноценного тестирования используйте кнопку "👁 Превью" и откройте каждое задание по очереди.
              </p>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowTest(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
