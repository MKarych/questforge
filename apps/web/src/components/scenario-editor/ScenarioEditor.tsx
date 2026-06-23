'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getBezierPath,
  EdgeProps,
  useReactFlow,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import {
  ScenarioNodeData,
  ScenarioEdge,
  NodeType,
  BLOCK_TYPES,
  BlockType,
  ValidationResult,
  ScenarioVariable,
  GameSettings,
  EdgeConditionType,
} from '@/types/scenario';
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

// Custom edge component with visual feedback and delete button
const ScenarioEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setEdges } = useReactFlow();

  const handleDeleteEdge = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds: Edge[]) => eds.filter((edge) => edge.id !== id));
    },
    [id, setEdges]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#f97316' : '#64748b',
          strokeWidth: selected ? 3 : 2,
          transition: 'stroke 0.15s, stroke-width 0.15s',
          cursor: 'pointer',
        }}
      />
      {/* Edge condition label */}
      {data?.condition?.label && (
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: selected ? '#f97316' : '#334155',
            color: '#fff',
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {data.condition.label}
        </div>
      )}
      {/* Delete button on hover */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 16}px)`,
          opacity: 0,
          transition: 'opacity 0.15s',
          cursor: 'pointer',
        }}
        className="edge-delete-btn group-hover:opacity-100"
        onClick={handleDeleteEdge}
        title="Удалить соединение"
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 'bold',
            lineHeight: 1,
          }}
        >
          ✕
        </div>
      </div>
    </>
  );
};

const edgeTypes = {
  default: ScenarioEdgeComponent,
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
  initialNodes?: Node<ScenarioNodeData>[];
  initialEdges?: Edge[];
  initialSettings?: GameSettings;
  onSave?: (data: any) => void;
  onNodesChange?: () => void;
  onEdgesChange?: () => void;
}

export default function ScenarioEditor({ scenarioName, initialNodes, initialEdges, initialSettings, onSave, onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback }: ScenarioEditorProps) {
  const [name, setName] = useState(scenarioName || 'Новый сценарий');
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState<Node<ScenarioNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationResult>({ valid: true, errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copiedNode, setCopiedNode] = useState<Node<ScenarioNodeData> | null>(null);
  const [currentPreviewNode, setCurrentPreviewNode] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Game settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    initialSettings || {
      totalTime: 0,
      defaultPoints: 10,
      defaultPenalty: 0,
      hintLimit: 3,
      maxAttempts: 3,
      variables: [],
    }
  );

  // Test mode state
  const [testCurrentNodeId, setTestCurrentNodeId] = useState<string | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, number | string | boolean>>({});
  const [testScore, setTestScore] = useState(0);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [testFinished, setTestFinished] = useState(false);

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

  const deleteEdge = useCallback(
    (edgeId: string) => {
      saveHistory('disconnect', undefined, edgeId);
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      setSelectedEdge(null);
    },
    [setEdges, saveHistory]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const isModKey = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete/Backspace - delete selected node or edge
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          e.preventDefault();
          deleteNode(selectedNode.id);
        } else if (selectedEdge) {
          e.preventDefault();
          deleteEdge(selectedEdge.id);
        }
      }

      // Esc - deselect everything
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
      }

      // Cmd/Ctrl+S - Save
      if (isModKey(e) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Cmd/Ctrl+Z - Undo
      if (isModKey(e) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Cmd/Ctrl+Shift+Z - Redo
      if (isModKey(e) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }

      // Cmd/Ctrl+C - Copy
      if (isModKey(e) && e.key === 'c') {
        e.preventDefault();
        if (selectedNode) {
          setCopiedNode(selectedNode);
        }
      }

      // Cmd/Ctrl+V - Paste
      if (isModKey(e) && e.key === 'v') {
        e.preventDefault();
        if (copiedNode) {
          pasteNode(copiedNode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, historyIndex, history, copiedNode, undo, redo, deleteEdge]);

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

      const baseData: ScenarioNodeData = {
        label: block.label,
        icon: block.icon,
        question: '',
        hint: '',
        points: gameSettings.defaultPoints,
        penalty: gameSettings.defaultPenalty,
      };

      // Add type-specific default data
      if (type === 'NPC') {
        baseData.npcName = '';
        baseData.npcDescription = '';
        baseData.npcDialogues = [{ npcText: '', options: [{ text: '', target: '' }] }];
      }

      if (type === 'BRANCH') {
        baseData.branches = [{ label: 'Да', target: '', condition: { type: 'always', label: 'Всегда' } }];
      }

      if (type === 'CODE') {
        baseData.attempts = gameSettings.maxAttempts;
      }

      if (type === 'TIMER') {
        baseData.duration = 60;
      }

      const newNode: Node<ScenarioNodeData> = {
        id: uuidv4(),
        type,
        position,
        data: baseData,
      };

      saveHistory('add', newNode.id);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, saveHistory, gameSettings]
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
      // Default condition is 'success' for mission nodes, 'always' for others
      const sourceNode = nodes.find((n) => n.id === params.source);
      const missionTypes = ['TEXT', 'CODE', 'PHOTO', 'GPS', 'QR', 'CHOICE', 'TIMER'];
      const defaultConditionType: EdgeConditionType =
        sourceNode && sourceNode.type && missionTypes.includes(sourceNode.type) ? 'success' : 'always';

      setEdges((eds) =>
        addEdge(
          {
            source: params.source!,
            target: params.target!,
            animated: true,
            data: {
              condition: {
                type: defaultConditionType,
                label: defaultConditionType === 'success' ? 'Успех' : 'Всегда',
              },
            },
          } as ScenarioEdge,
          eds
        )
      );
    },
    [setEdges, saveHistory, nodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<ScenarioNodeData>);
    },
    []
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
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
        settings: gameSettings,
      });
    }
  }, [name, nodes, edges, onSave, validateScenario, gameSettings]);

  const startNodeId = useMemo(
    () => nodes.find((n) => n.type === 'START')?.id || '',
    [nodes]
  );

  // Preview handler
  const handlePreviewNode = (nodeId: string) => {
    setCurrentPreviewNode(nodeId);
    setShowPreview(true);
  };

  // Test mode handlers
  const handleTestStart = () => {
    // Initialize test state
    const startNode = nodes.find((n) => n.type === 'START');
    if (startNode) {
      setTestCurrentNodeId(startNode.id);
    }
    // Initialize variables with defaults
    const initialVars: Record<string, number | string | boolean> = {};
    gameSettings.variables.forEach((v) => {
      initialVars[v.name] = v.defaultValue;
    });
    setTestVariables(initialVars);
    setTestScore(0);
    setTestLog([`🧪 Тестирование начато. Сценарий: "${name}"`]);
    setTestFinished(false);
    setShowTest(true);
  };

  const handleTestAnswer = useCallback(
    (answer: string) => {
      if (!testCurrentNodeId || testFinished) return;

      const currentNode = nodes.find((n) => n.id === testCurrentNodeId);
      if (!currentNode) return;

      const newLog = [...testLog];
      let newScore = testScore;
      const newVars = { ...testVariables };
      let nextNodeId: string | null = null;

      // Find outgoing edges from current node
      const outgoingEdges = edges.filter((e) => e.source === testCurrentNodeId);

      if (currentNode.type === 'CHOICE') {
        const optionIndex = parseInt(answer);
        const isCorrect = optionIndex === currentNode.data.correctOption;
        if (isCorrect) {
          newScore += currentNode.data.points || gameSettings.defaultPoints;
          newVars.score = newScore;
          newLog.push(`✅ Правильно! +${currentNode.data.points || gameSettings.defaultPoints} очков`);
        } else {
          newScore -= currentNode.data.penalty || gameSettings.defaultPenalty;
          newVars.score = newScore;
          newLog.push(`❌ Неправильно. -${currentNode.data.penalty || gameSettings.defaultPenalty} очков`);
        }
        // Find success/fail edge
        const conditionType = isCorrect ? 'success' : 'fail';
        const matchingEdge = outgoingEdges.find(
          (e) => (e as ScenarioEdge).data?.condition?.type === conditionType
        );
        nextNodeId = matchingEdge?.target || null;
      } else if (currentNode.type === 'TEXT' || currentNode.type === 'CODE') {
        const correctAnswer = currentNode.data.textAnswer || currentNode.data.code || '';
        const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        if (isCorrect) {
          newScore += currentNode.data.points || gameSettings.defaultPoints;
          newVars.score = newScore;
          newLog.push(`✅ Правильно! +${currentNode.data.points || gameSettings.defaultPoints} очков`);
        } else {
          newScore -= currentNode.data.penalty || gameSettings.defaultPenalty;
          newVars.score = newScore;
          newLog.push(`❌ Неправильно. -${currentNode.data.penalty || gameSettings.defaultPenalty} очков`);
        }
        const conditionType = isCorrect ? 'success' : 'fail';
        const matchingEdge = outgoingEdges.find(
          (e) => (e as ScenarioEdge).data?.condition?.type === conditionType
        );
        nextNodeId = matchingEdge?.target || null;
      } else if (currentNode.type === 'NPC') {
        // NPC dialogue - answer determines next node
        const dialogueIndex = parseInt(answer);
        const dialogue = currentNode.data.npcDialogues?.[dialogueIndex];
        if (dialogue) {
          newLog.push(`🗣 ${currentNode.data.npcName}: "${dialogue.npcText}"`);
          newLog.push(`👤 Вы выбрали: "${dialogue.options[0]?.text || 'Продолжить'}"`);
          nextNodeId = dialogue.options[0]?.target || null;
        }
      } else {
        // Default: follow first outgoing edge
        nextNodeId = outgoingEdges[0]?.target || null;
        newLog.push(`➡️ Переход к следующему узлу`);
      }

      // If no matching edge found, try 'always' condition
      if (!nextNodeId) {
        const alwaysEdge = outgoingEdges.find(
          (e) => (e as ScenarioEdge).data?.condition?.type === 'always'
        );
        nextNodeId = alwaysEdge?.target || null;
      }

      // If still no next node, try first edge
      if (!nextNodeId && outgoingEdges.length > 0) {
        nextNodeId = outgoingEdges[0].target;
      }

      // Check if we reached FINISH
      const nextNode = nodes.find((n) => n.id === nextNodeId);
      if (nextNode?.type === 'FINISH' || !nextNodeId) {
        newLog.push(`🏁 Сценарий пройден! Итоговый счёт: ${newScore}`);
        setTestFinished(true);
        setTestCurrentNodeId(null);
      } else {
        setTestCurrentNodeId(nextNodeId);
      }

      setTestScore(newScore);
      setTestVariables(newVars);
      setTestLog(newLog);
    },
    [testCurrentNodeId, testFinished, nodes, edges, testLog, testScore, testVariables, gameSettings]
  );

  const handleTestRestart = () => {
    handleTestStart();
  };

  // Variable management
  const addVariable = useCallback(() => {
    const newVar: ScenarioVariable = {
      id: uuidv4(),
      name: '',
      type: 'number',
      defaultValue: 0,
    };
    setGameSettings((prev) => ({
      ...prev,
      variables: [...prev.variables, newVar],
    }));
  }, []);

  const updateVariable = useCallback((id: string, field: keyof ScenarioVariable, value: any) => {
    setGameSettings((prev) => ({
      ...prev,
      variables: prev.variables.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  }, []);

  const removeVariable = useCallback((id: string) => {
    setGameSettings((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v.id !== id),
    }));
  }, []);

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
            onClick={() => setShowSettings(!showSettings)}
            className="btn-secondary text-sm"
            title="Настройки игры"
          >
            ⚙️ Настройки
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
            onNodesChange={(changes) => {
              handleNodesChange(changes);
              onNodesChangeCallback?.();
            }}
            onEdgesChange={(changes) => {
              handleEdgesChange(changes);
              onEdgesChangeCallback?.();
            }}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onSelectionChange={onSelectionChange}
            onPaneClick={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-background"
            deleteKeyCode={null}
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
            allNodes={nodes}
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div className="text-white font-semibold">⚙️ Настройки игры</div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* General Settings */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Общие настройки</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Общее время (мин), 0 = без лимита</label>
                    <input
                      type="number"
                      value={gameSettings.totalTime ?? 0}
                      onChange={(e) =>
                        setGameSettings((prev) => ({ ...prev, totalTime: parseInt(e.target.value) || 0 }))
                      }
                      className="input-field text-sm"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Лимит подсказок</label>
                    <input
                      type="number"
                      value={gameSettings.hintLimit}
                      onChange={(e) =>
                        setGameSettings((prev) => ({ ...prev, hintLimit: parseInt(e.target.value) || 1 }))
                      }
                      className="input-field text-sm"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Очки по умолчанию</label>
                    <input
                      type="number"
                      value={gameSettings.defaultPoints}
                      onChange={(e) =>
                        setGameSettings((prev) => ({ ...prev, defaultPoints: parseInt(e.target.value) || 0 }))
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Штраф по умолчанию</label>
                    <input
                      type="number"
                      value={gameSettings.defaultPenalty}
                      onChange={(e) =>
                        setGameSettings((prev) => ({ ...prev, defaultPenalty: parseInt(e.target.value) || 0 }))
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Макс. попыток</label>
                    <input
                      type="number"
                      value={gameSettings.maxAttempts}
                      onChange={(e) =>
                        setGameSettings((prev) => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1 }))
                      }
                      className="input-field text-sm"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Variables */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Переменные сценария</h3>
                <div className="space-y-2">
                  {gameSettings.variables.map((v) => (
                    <div key={v.id} className="flex gap-2 items-start p-2 bg-background/50 rounded border border-border">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVariable(v.id, 'name', e.target.value)}
                          className="input-field text-xs"
                          placeholder="Имя переменной"
                        />
                        <div className="flex gap-1">
                          <select
                            value={v.type}
                            onChange={(e) => updateVariable(v.id, 'type', e.target.value)}
                            className="input-field text-xs flex-1"
                          >
                            <option value="number">Число</option>
                            <option value="string">Строка</option>
                            <option value="boolean">Булево</option>
                          </select>
                          <input
                            type="text"
                            value={String(v.defaultValue)}
                            onChange={(e) => {
                              const val = v.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                              updateVariable(v.id, 'defaultValue', val);
                            }}
                            className="input-field text-xs w-20"
                            placeholder="По умолч."
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeVariable(v.id)}
                        className="text-error hover:text-error/80 text-lg mt-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button onClick={addVariable} className="btn-secondary text-xs w-full">
                    + Добавить переменную
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800 border-t flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Mode Modal - Interactive */}
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
              {/* Score & Variables Bar */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="text-yellow-400 font-bold">⭐ {testScore} очков</span>
                  {Object.entries(testVariables).filter(([k]) => k !== 'score').length > 0 && (
                    <div className="flex gap-2 text-xs text-gray-400">
                      {Object.entries(testVariables)
                        .filter(([k]) => k !== 'score')
                        .map(([key, val]) => (
                          <span key={key} className="bg-gray-700 px-2 py-1 rounded">
                            {key}: {String(val)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                <button onClick={handleTestRestart} className="btn-secondary text-xs">
                  🔄 Заново
                </button>
              </div>

              {/* Current Task */}
              {testCurrentNodeId && !testFinished && (() => {
                const currentNode = nodes.find((n) => n.id === testCurrentNodeId);
                if (!currentNode) return <p className="text-gray-400">Узел не найден</p>;

                return (
                  <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/50">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{currentNode.data.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{currentNode.data.label}</h3>
                        <span className="text-sm text-gray-400">
                          {nodes.findIndex((n) => n.id === testCurrentNodeId) > 0
                            ? `Задание ${nodes.findIndex((n) => n.id === testCurrentNodeId)}`
                            : 'Начало'}
                        </span>
                      </div>
                    </div>

                    {currentNode.data.question && (
                      <p className="text-gray-300 mb-4 text-lg">{currentNode.data.question}</p>
                    )}

                    {currentNode.data.hint && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mb-4">
                        <span className="text-yellow-400 text-sm">💡 Подсказка: {currentNode.data.hint}</span>
                      </div>
                    )}

                    {/* NPC Dialogue */}
                    {currentNode.type === 'NPC' && currentNode.data.npcDialogues && (
                      <div className="space-y-3 mb-4">
                        {currentNode.data.npcDialogues.map((dialogue: { npcText: string; options: Array<{ text: string; target: string }> }, dIdx: number) => (
                          <div key={dIdx} className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-lg">
                            <div className="flex items-start gap-3 mb-3">
                              <span className="text-2xl">🗣</span>
                              <div>
                                <p className="text-cyan-300 font-semibold text-sm">{currentNode.data.npcName}</p>
                                <p className="text-gray-200 mt-1">{dialogue.npcText}</p>
                              </div>
                            </div>
                            <div className="space-y-2 ml-8">
                              {dialogue.options.map((opt: { text: string; target: string }, oIdx: number) => (
                                <button
                                  key={oIdx}
                                  onClick={() => handleTestAnswer(String(dIdx))}
                                  className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition-colors"
                                >
                                  {opt.text || `Вариант ${oIdx + 1}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CHOICE */}
                    {currentNode.type === 'CHOICE' && currentNode.data.options && (
                      <div className="space-y-2 mb-4">
                        {currentNode.data.options.map((option: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleTestAnswer(String(idx))}
                            className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition-colors border border-gray-600"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TEXT / CODE input */}
                    {(currentNode.type === 'TEXT' || currentNode.type === 'CODE') && (
                      <div className="space-y-3 mb-4">
                        <input
                          type="text"
                          placeholder={currentNode.type === 'CODE' ? 'Введите код...' : 'Введите ответ...'}
                          className="input-field text-sm w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTestAnswer((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500">Нажмите Enter, чтобы отправить ответ</p>
                      </div>
                    )}

                    {/* Simple nodes - just show continue button */}
                    {(currentNode.type && ['START', 'BRANCH', 'TIMER', 'PHOTO', 'GPS', 'QR'].includes(currentNode.type)) && (
                      <button
                        onClick={() => handleTestAnswer('continue')}
                        className="btn-primary w-full"
                      >
                        ➡️ Продолжить
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Test Finished */}
              {testFinished && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏁</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Сценарий пройден!</h2>
                  <p className="text-gray-400 mb-2">Итоговый счёт: <span className="text-yellow-400 font-bold text-xl">{testScore}</span></p>
                  <button onClick={handleTestRestart} className="btn-primary mt-4">
                    🔄 Пройти заново
                  </button>
                </div>
              )}

              {/* Test Log */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">📋 Лог тестирования</h4>
                <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                  {testLog.map((entry, idx) => (
                    <p key={idx} className="text-xs text-gray-400">{entry}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800 border-t flex justify-end">
              <button
                onClick={() => setShowTest(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
