'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getBezierPath,
  EdgeProps,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  Edge,
  Node,
  SelectionMode,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import {
  BlockDefinition,
  BLOCK_DEFINITIONS,
  MissionType,
  Scene,
  Condition,
} from '@/lib/editor-store/editor.types';
import BlockPalette from './BlockPalette';
import NodeSettings from './NodeSettings';
import VariablesPanel from './VariablesPanel';
import PreviewModal from './PreviewModal';
import TestModal from './TestModal';
import EditorNodeComponent from './EditorNode';
import AssetPanel from './AssetPanel';
import LivePreview from './LivePreview';
import ScenarioTemplatesModal from './ScenarioTemplatesModal';
import AiChat from './AiChat';
import AuthorAchievements from './AuthorAchievements';
import ToolbarSettingsModal from './ToolbarSettingsModal';
import RoleManager from './RoleManager';
import ConditionBuilder from './ConditionBuilder';
import ParallelScenarioManager from "./ParallelScenarioManager";
import TriggerEditor from './TriggerEditor';
import { autoSaveManager } from '@/lib/editor-store/autosave';

// ==================== Node Types for React Flow ====================
// Определяем на уровне модуля для стабильной ссылки (важно для React Flow)
const nodeTypes = {
  location: EditorNodeComponent,
  quiz: EditorNodeComponent,
  dialogue: EditorNodeComponent,
  conference: EditorNodeComponent,
  rpg: EditorNodeComponent,
  slide: EditorNodeComponent,
  custom: EditorNodeComponent,
};

// ==================== Custom Edge ====================
const CustomEdge = ({
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
  const [showConditionEditor, setShowConditionEditor] = useState(false);
  const storeEdges = useEditorStore((s) => s.edges);
  const setEdgesInStore = useEditorStore((s) => s.setEdges);

  const hasCondition = data?.condition != null;

  const handleDeleteEdge = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds: Edge[]) => eds.filter((edge) => edge.id !== id));
    },
    [id, setEdges]
  );

  const handleConditionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConditionEditor(true);
  }, []);

  const handleConditionChange = useCallback((condition: Condition | null) => {
    const cond = condition ?? undefined;
    // Обновляем в React Flow
    setEdges((eds: Edge[]) =>
      eds.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              data: {
                ...edge.data,
                condition: cond,
                label: cond ? '⚡ Условие' : 'Всегда',
                transitionType: cond ? 'conditional' : 'auto',
              },
            }
          : edge
      )
    );
    // Обновляем в store
    const currentEdges = useEditorStore.getState().edges;
    const updatedEdges = currentEdges.map((e) =>
      e.id === id
        ? {
            ...e,
            data: {
              ...e.data,
              condition: cond,
              label: cond ? '⚡ Условие' : 'Всегда',
              transitionType: cond ? 'conditional' as const : 'auto' as const,
            },
          }
        : e
    );
    setEdgesInStore(updatedEdges);
  }, [id, setEdges, setEdgesInStore]);

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
      {/* Лейбл ребра */}
      {data?.label && (
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
          {data.label}
        </div>
      )}
      {/* Иконка условия ⚡ — кликабельная */}
      {hasCondition && (
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 16}px)`,
            cursor: 'pointer',
            zIndex: 10,
          }}
          onClick={handleConditionClick}
          title="Редактировать условие перехода"
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#f59e0b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              lineHeight: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s',
            }}
            className="hover:scale-110"
          >
            ⚡
          </div>
        </div>
      )}
      {/* Кнопка удаления */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 32}px)`,
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

      {/* Модалка редактирования условия */}
      {showConditionEditor && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: 400,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ConditionBuilder
            value={data?.condition || null}
            onChange={handleConditionChange}
            title="Условие перехода"
            showApply
            onApply={() => setShowConditionEditor(false)}
          />
        </div>
      )}
    </>
  );
};

const CustomEdgeMemo = memo(CustomEdge);

const edgeTypes = {
  default: CustomEdgeMemo,
};

// ==================== Props ====================
interface ScenarioEditorV2Props {
  scenarioId?: string;
  initialName?: string;
  initialDescription?: string;
  isPublished?: boolean;
  onSave?: (data: any) => void;
  onPublish?: () => void;
  headerHidden?: boolean;
  onToggleHeader?: () => void;
}

// ==================== Inner Component ====================
function ScenarioEditorInner({
  scenarioId,
  initialName,
  initialDescription,
  isPublished = false,
  onSave,
  onPublish,
  headerHidden = false,
  onToggleHeader,
}: ScenarioEditorV2Props) {
  const reactFlowInstance = useReactFlow();
  // Используем селекторы для стабильных ссылок — это критически важно для useNodesState/useEdgesState,
  // чтобы они не сбрасывали позиции узлов при ререндерах, вызванных изменением других полей стора
  const storeScenes = useEditorStore((s) => s.scenes, shallow);
  const storeEdges = useEditorStore((s) => s.edges, shallow);
  const store = useEditorStore();
  const initialized = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTemplatesOnStart, setShowTemplatesOnStart] = useState(true);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [showTriggerEditor, setShowTriggerEditor] = useState(false);
  const [showParallelManager, setShowParallelManager] = useState(false);

  // Initialize store with initial data
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (initialName) {
      store.setName(initialName);
    }
    if (initialDescription) {
      store.setDescription(initialDescription);
    }
    if (scenarioId) {
      store.setScenarioId(scenarioId);
    }
  }, []);

  // Load showTemplatesOnStart preference from user profile
  useEffect(() => {
    async function loadPreference() {
      try {
        const { getProfile } = await import('@/lib/api/client');
        const response = await getProfile();
        const user = (response as any)?.data;
        if (user?.toolbarSettings?.showTemplatesOnStart === false) {
          setShowTemplatesOnStart(false);
        }
      } catch {
        // Use default (true)
      }
    }
    loadPreference();
  }, []);

  // Convert Scene[] to React Flow Node[]
  // Используем storeScenes (с shallow-сравнением) вместо store.scenes,
  // чтобы useMemo возвращал стабильную ссылку и useNodesState не сбрасывал позиции узлов
  const rfNodes: Node[] = useMemo(
    () =>
      storeScenes.map((s) => ({
        id: s.id,
        type: s.type,
        position: s.position,
        data: s,
      })),
    [storeScenes]
  );

  // Convert Edge[] to React Flow Edge[]
  const rfEdges: Edge[] = useMemo(
    () =>
      storeEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        animated: e.animated,
        data: e.data,
      })),
    [storeEdges]
  );

  // Управление узлами и рёбрами через useNodesState/useEdgesState
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Синхронизация структуры узлов и рёбер из store в React Flow.
  // Когда store обновляется (загрузка шаблона, undo/redo, clearAll),
  // rfNodes/rfEdges пересчитываются через useMemo, но useNodesState
  // не обновляет своё внутреннее состояние автоматически.
  // Этот useEffect форсирует синхронизацию при изменении flowKey.
  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, store.flowKey, setNodes, setEdges]);

  // AutoSave
  useEffect(() => {
    autoSaveManager.start(() => {
      store.saveToLocalStorage();
    });
    return () => autoSaveManager.stop();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedNodes.length > 0) {
          e.preventDefault();
          store.selectedNodes.forEach((id) => store.removeScene(id));
        }
        if (store.selectedEdges.length > 0) {
          e.preventDefault();
          store.selectedEdges.forEach((id) => store.removeEdge(id));
        }
      }

      // Esc
      if (e.key === 'Escape') {
        store.clearSelection();
      }

      // Save
      if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Undo
      if (isMod && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        store.undo();
      }

      // Redo
      if (isMod && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        store.redo();
      }

      // Copy
      if (isMod && e.code === 'KeyC') {
        e.preventDefault();
        if (store.selectedNodes.length > 0) {
          store.copyNodes(store.selectedNodes);
        }
      }

      // Paste
      if (isMod && e.code === 'KeyV') {
        e.preventDefault();
        store.pasteNodes();
      }

      // Select All
      if (isMod && e.code === 'KeyA') {
        e.preventDefault();
        reactFlowInstance.setNodes((nds: Node[]) =>
          nds.map((n) => ({ ...n, selected: true }))
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, store.selectedNodes, store.selectedEdges]);

  // Drag & Drop
  const onDragStart = (event: React.DragEvent, block: BlockDefinition) => {
    // Передаём label блока, чтобы onDrop мог найти точный блок
    event.dataTransfer.setData('application/reactflow', block.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const label = event.dataTransfer.getData('application/reactflow');
      if (!label) return;

      // Ищем блок по label (не по type, т.к. type может быть одинаковым у разных блоков)
      const block = BLOCK_DEFINITIONS.find(b => b.label === label);
      if (!block) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      // Смещаем новый блок относительно предыдущих, чтобы они не накладывались
      const existingCount = store.scenes.length;
      const position = {
        x: event.clientX - reactFlowBounds.left - 100 + (existingCount % 3) * 40,
        y: event.clientY - reactFlowBounds.top - 50 + Math.floor(existingCount / 3) * 40,
      };

      // Добавляем в store
      store.addScene(block.type, position, block.label);
      // Добавляем в React Flow напрямую
      // Используем getState() для получения актуального состояния после addScene
      const newScene = useEditorStore.getState().scenes.slice(-1)[0];
      if (newScene) {
        setNodes((nds) => [
          ...nds,
          {
            id: newScene.id,
            type: newScene.type,
            position: newScene.position,
            data: newScene,
          },
        ]);
      }
    },
    [store, setNodes]
  );

  // Добавление блока по клику из палитры
  const onPaletteClick = useCallback(
    (block: BlockDefinition) => {
      // Размещаем новый блок со смещением, чтобы не накладывался на существующие
      const existingCount = store.scenes.length;
      const position = {
        x: 200 + (existingCount % 3) * 320,
        y: 100 + Math.floor(existingCount / 3) * 200,
      };
      // Создаём сцену в store
      store.addScene(block.type, position, block.label);
      // После addScene Zustand обновил внутреннее состояние, но store.scenes
      // в этом замыкании всё ещё указывает на старый массив.
      // Используем useEditorStore.getState() для получения актуального состояния.
      const currentScenes = useEditorStore.getState().scenes;
      const newScene = currentScenes[currentScenes.length - 1];
      if (newScene) {
        setNodes((nds) => [
          ...nds,
          {
            id: newScene.id,
            type: newScene.type,
            position: newScene.position,
            data: newScene,
          },
        ]);
      }
    },
    [store, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Connect
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        store.addEdge(params.source, params.target);
        // Добавляем ребро в React Flow напрямую, аналогично onPaletteClick
        const currentEdges = useEditorStore.getState().edges;
        const newEdge = currentEdges[currentEdges.length - 1];
        if (newEdge) {
          setEdges((eds) => [
            ...eds,
            {
              id: newEdge.id,
              source: newEdge.source,
              target: newEdge.target,
              type: 'default',
              animated: newEdge.animated,
              data: newEdge.data,
            },
          ]);
        }
      }
    },
    [store, setEdges]
  );

  // Selection + Live Preview
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      store.selectNode(node.id);
    },
    [store]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      store.setLivePreviewScene(node.id);
    },
    [store]
  );

  // Сохраняем финальную позицию узла после завершения drag
  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, _node: Node) => {
      // Drag начался — React Flow сам обновляет позицию узла в useNodesState
    },
    []
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      store.moveScene(node.id, node.position);
    },
    [store]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      store.selectEdge(edge.id);
    },
    [store]
  );

  const onPaneClick = useCallback(() => {
    store.clearSelection();
  }, [store]);

  // Selected scene for settings panel
  const selectedSceneData = useMemo(() => {
    if (store.selectedNodes.length === 1) {
      return store.scenes.find((s) => s.id === store.selectedNodes[0]) || null;
    }
    return null;
  }, [store.selectedNodes, store.scenes]);

  // Save
  const handleSave = useCallback(() => {
    store.validate();
    const validation = store.validationResult;

    if (validation.valid && onSave) {
      const startScene = store.scenes.find((s) => s.title === 'Старт') || store.scenes[0];
      onSave({
        name: store.name,
        description: store.description,
        nodes: store.scenes,
        edges: store.edges,
        startNodeId: startScene?.id,
        settings: store.settings,
        variables: store.variables,
      });
      store.clearAutoSave();
    }
  }, [store, onSave]);

  // Preview
  const previewScene = useMemo(() => {
    if (!store.previewSceneId) return null;
    return store.scenes.find((s) => s.id === store.previewSceneId) || null;
  }, [store.previewSceneId, store.scenes]);

  const isEmpty = store.scenes.length === 0;
  const hasErrors = store.validationResult.errors.length > 0;
  const tb = store.toolbarSettings;

  // Toolbar button class helper
  const tbBtn = (extra = '') => {
    const sizeMap = {
      small: 'text-[10px] px-1 py-0.5',
      medium: 'text-xs px-1.5 py-1',
      large: 'text-sm px-2.5 py-1.5',
    };
    return `btn-secondary ${sizeMap[tb.size]} ${extra}`;
  };

  // Toolbar button content helper
  const tbContent = (icon: string, label: string) => {
    if (tb.display === 'icon') return icon;
    if (tb.display === 'label') return label;
    return <><span>{icon}</span><span className="ml-1">{label}</span></>;
  };

  // Show templates modal on first load if empty and user hasn't disabled it
  useEffect(() => {
    if (isEmpty && store.scenes.length === 0 && !store.showTemplates && showTemplatesOnStart) {
      store.setShowTemplates(true);
    }
  }, [showTemplatesOnStart]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar — адаптивный под настройки пользователя */}
      <div className={`bg-background border-b border-border flex items-center justify-between px-3 ${
        tb.size === 'small' ? 'h-9' : tb.size === 'large' ? 'h-13' : 'h-11'
      }`}>
        <div className="flex items-center gap-1.5">
          {/* Toggle header visibility */}
          {onToggleHeader && (
            <button
              onClick={onToggleHeader}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-background-modifier-hover text-xs"
              title={headerHidden ? 'Показать шапку' : 'Скрыть шапку'}
            >
              {headerHidden ? '⤵' : '⤴'}
            </button>
          )}
          <input
            type="text"
            value={store.name}
            onChange={(e) => store.setName(e.target.value)}
            className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-0.5 w-48"
            placeholder="Название сценария"
          />
          {/* Templates button */}
          <button
            onClick={() => store.setShowTemplates(true)}
            className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            title="Выбрать шаблон"
          >
            📋
          </button>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isPublished
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            {isPublished ? 'PUB' : 'DRF'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Validation indicator — кликабельный, открывает панель ошибок */}
          {hasErrors && (
            <button
              onClick={() => {
                store.setPanel('validation', true);
              }}
              className="text-[10px] text-error bg-error/10 hover:bg-error/20 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              title={`${store.validationResult.errors.filter(e => e.severity === 'error').length} ошибок, ${store.validationResult.errors.filter(e => e.severity === 'warning').length} предупреждений`}
            >
              ⚠️{store.validationResult.errors.length}
            </button>
          )}

          <button onClick={() => { store.validate(); }}
            className={tbBtn()}
            title="Проверить сценарий"
          >
            {tbContent('✅', 'Проверить')}
          </button>

          <button onClick={() => {
              const startScene = store.scenes.find((n) => n.title === 'Старт');
              if (startScene) {
                store.setPreviewScene(startScene.id);
                store.setMode('preview');
              }
            }}
            className={tbBtn()}
            title="Превью"
          >
            {tbContent('👁', 'Превью')}
          </button>

          <button onClick={() => store.startTest()}
            className={tbBtn()}
            title="Тестирование"
          >
            {tbContent('🎮', 'Тест')}
          </button>

          {/* 🤖 AI-ассистент (чат) */}
          <button onClick={() => store.setShowAiChat(true)}
            className={tbBtn('bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border-primary/20')}
            title="AI-ассистент — создание и доработка сценариев"
          >
            {tbContent('🤖', 'AI')}
          </button>

          <button onClick={() => store.togglePanel('variables')}
            className={`${tbBtn()} ${store.openPanels.variables ? 'bg-primary/20' : ''}`}
            title="Переменные"
          >
            {tbContent('📊', 'Перем')}
          </button>

          {/* 👤 Роли */}
          <button onClick={() => setShowRoleManager(true)}
            className={`${tbBtn()} ${showRoleManager ? 'bg-primary/20' : ''}`}
            title="Управление ролями"
          >
            {tbContent('👤', 'Роли')}
          </button>

          {/* ⚡ Триггеры */}
          <button onClick={() => setShowTriggerEditor(true)}
            className={`${tbBtn()} ${showTriggerEditor ? 'bg-primary/20' : ''} relative`}
            title="Управление триггерами и событиями"
          >
            {tbContent('⚡', 'Триггеры')}

          /* 📑 Параллельные */
          <button onClick={() => setShowParallelManager(true)}
            className={`${tbBtn()} ${showParallelManager ? "bg-primary/20" : ""} relative`}
            title="Управление параллельными сценариями"
          >
            {tbContent('📑', 'Паралл')}
            {store.parallelScenarios.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {store.parallelScenarios.length}
              </span>
            )}
          </button>
            {store.triggers.filter(t => t.enabled).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {store.triggers.filter(t => t.enabled).length}
              </span>
            )}
          </button>

          <button onClick={() => store.togglePanel('validation')}
            className={`${tbBtn()} ${store.openPanels.validation ? 'bg-primary/20' : ''}`}
            title="Валидация"
          >
            {tbContent('📋', 'Ошибки')}
          </button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <button onClick={store.undo}
            disabled={store.history.undoStack.length === 0}
            className={tbBtn('disabled:opacity-30')}
            title="Отменить (Ctrl+Z)"
          >
            ↩️
          </button>

          <button onClick={store.redo}
            disabled={store.history.redoStack.length === 0}
            className={tbBtn('disabled:opacity-30')}
            title="Повторить (Ctrl+Shift+Z)"
          >
            ↪️
          </button>

          {!isPublished && onPublish && (
            <button onClick={onPublish}
              className={`btn-primary ${tb.size === 'small' ? 'text-[10px] px-1.5 py-0.5' : tb.size === 'large' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'} bg-green-600 hover:bg-green-700`}
            >
              {tbContent('📢', 'Опублик')}
            </button>
          )}

          {/* 🗑️ Очистить всё */}
          <button onClick={() => setShowClearConfirm(true)}
            className={tbBtn('text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20')}
            title="Очистить все блоки"
          >
            🗑️
          </button>

          {/* ⚙️ Настройки панели */}
          <button
            onClick={() => store.setShowToolbarSettings(true)}
            className={tbBtn('relative z-10')}
            title="Настройки панели инструментов"
          >
            {tbContent('⚙️', 'Настр')}
          </button>

          {/* Author Achievements */}
          <AuthorAchievements
            unlockedIds={store.authorAchievements.map((a) => a.id)}
            newAchievements={store.newAchievementAlerts.map((a) => ({
              id: a.id,
              name: '',
              description: '',
              icon: '',
              condition: () => false,
              unlocked: true,
              unlockedAt: a.unlockedAt,
            }))}
            onDismissNew={() => store.dismissNewAchievements()}
          />

          <button
            onClick={handleSave}
            disabled={!store.isDirty}
            className={`btn-primary text-sm ${
              !store.isDirty ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={!store.isDirty ? 'Нет изменений' : 'Сохранить (Ctrl+S)'}
          >
            💾 Сохранить
          </button>
        </div>
      </div>

      {/* Validation Modal */}
      {store.openPanels.validation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">{hasErrors ? '⚠️' : '✅'}</span>
                <h2 className="text-base font-semibold text-text-primary">
                  {hasErrors ? 'Результаты проверки' : 'Проверка пройдена'}
                </h2>
              </div>
              <button
                onClick={() => store.setPanel('validation', false)}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {!hasErrors ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-5xl mb-4">✅</span>
                  <p className="text-base font-medium text-text-primary mb-1">Всё хорошо</p>
                  <p className="text-sm text-text-secondary">Ошибок и предупреждений нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Errors section */}
                  {store.validationResult.errors.filter(e => e.severity === 'error').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                        <span>🔴</span>
                        <span>Ошибки ({store.validationResult.errors.filter(e => e.severity === 'error').length})</span>
                      </h3>
                      <div className="space-y-1.5">
                        {store.validationResult.errors
                          .filter(e => e.severity === 'error')
                          .map((err, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                              <span className="text-sm mt-0.5">❌</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{err.message}</p>
                                {err.sceneId && (
                                  <p className="text-xs text-text-secondary mt-0.5">Сцена: {err.sceneId}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings section */}
                  {store.validationResult.errors.filter(e => e.severity === 'warning').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-1.5">
                        <span>🟡</span>
                        <span>Предупреждения ({store.validationResult.errors.filter(e => e.severity === 'warning').length})</span>
                      </h3>
                      <div className="space-y-1.5">
                        {store.validationResult.errors
                          .filter(e => e.severity === 'warning')
                          .map((err, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                              <span className="text-sm mt-0.5">⚠️</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{err.message}</p>
                                {err.sceneId && (
                                  <p className="text-xs text-text-secondary mt-0.5">Сцена: {err.sceneId}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-3 border-t border-border">
              <button
                onClick={() => store.setPanel('validation', false)}
                className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex">
        {/* Block Palette */}
        <BlockPalette onDragStart={onDragStart} onClick={onPaletteClick} />

        {/* Canvas */}
        <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
          {/* Empty state */}
          {isEmpty && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8 rounded-lg bg-background/80 backdrop-blur-sm border border-dashed border-border max-w-md">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Холст пуст</h3>
                <p className="text-text-secondary">
                  Перетащите блок из палитры, чтобы начать
                </p>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodesDraggable={true}
            elementsSelectable={true}
            nodeDragThreshold={1}
            connectOnClick={false}
            connectionMode={ConnectionMode.Strict}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-background"
            deleteKeyCode={null}
            selectionMode={SelectionMode.Partial}
            panOnDrag={[1, 2]}
            panOnScroll={false}
            zoomOnScroll={true}
          >
            <Background color="#888" gap={20} />
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                const block = BLOCK_DEFINITIONS.find((b) => b.type === n.type);
                return block ? block.color.replace('bg-', 'border-') : '#888';
              }}
              nodeColor={(n) => {
                const block = BLOCK_DEFINITIONS.find((b) => b.type === n.type);
                return block ? `#${block.color.split('-')[1]}20` : '#eee';
              }}
              nodeBorderRadius={8}
            />
          </ReactFlow>
        </div>

        {/* Right Panel */}
        <div className="flex">
          {/* Node Settings */}
          {selectedSceneData && store.openPanels.properties && (
            <NodeSettings
              node={selectedSceneData}
              onUpdate={store.updateScene}
              onDelete={store.removeScene}
              onAddMission={(sceneId, type) => store.addMission(sceneId, type as MissionType)}
              onUpdateMission={store.updateMission}
              onRemoveMission={store.removeMission}
              onClose={() => store.clearSelection()}
              onOpenAssetPicker={() => {
                store.togglePanel('debugger');
              }}
            />
          )}

          {/* Variables Panel */}
          {store.openPanels.variables && !selectedSceneData && (
            <div className="w-80 bg-background border-l border-border p-4 overflow-y-auto">
              <VariablesPanel
                variables={store.variables}
                onAdd={() => store.addVariable()}
                onUpdate={(index, data) => store.updateVariable(index, data)}
                onRemove={(index) => store.removeVariable(index)}
              />
            </div>
          )}

          {/* Asset Manager Panel */}
          {store.openPanels.debugger && !selectedSceneData && (
            <div className="w-80 bg-background border-l border-border overflow-y-auto">
              <AssetPanel />
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {store.mode === 'preview' && previewScene && (
        <PreviewModal
          node={previewScene}
          allScenes={store.scenes}
          onClose={() => {
            store.setMode('edit');
            store.setPreviewScene(null);
          }}
          onNavigate={(sceneId) => store.setPreviewScene(sceneId)}
        />
      )}

      {/* Test Modal */}
      {store.mode === 'test' && store.testState && (
        <TestModal
          testState={store.testState}
          scenes={store.scenes}
          onAnswer={(answer) => store.testAnswer(answer)}
          onRestart={() => store.testRestart()}
          onClose={() => store.stopTest()}
        />
      )}

      {/* Templates Modal */}
      {store.showTemplates && (
        <ScenarioTemplatesModal
          onSelect={(template) => {
            store.loadScenario({
              name: template.name,
              description: template.description,
              scenes: template.scenes,
              edges: template.edges,
              variables: [],
              settings: {
                totalTime: 0,
                defaultPoints: 10,
                defaultPenalty: 0,
                hintLimit: 3,
                maxAttempts: 3,
                variables: [],
                roles: [],
              },
            });
            store.setShowTemplates(false);
            store.addAuthorAchievement('first_scenario');
          }}
          onDontShowAgain={async () => {
            setShowTemplatesOnStart(false);
            try {
              const { updateUserSettings } = await import('@/lib/api/client');
              await updateUserSettings({
                toolbarSettings: {
                  ...store.toolbarSettings,
                  showTemplatesOnStart: false,
                },
              });
            } catch {
              // Не удалось сохранить настройку
            }
          }}
          onClose={() => store.setShowTemplates(false)}
        />
      )}

      {/* AI Chat Modal — единый AI-ассистент */}
      {store.showAiChat && (
        <AiChat
          scenarioJson={store.scenes.length > 0 ? JSON.stringify({
            id: store.scenarioId || '',
            name: store.name,
            description: store.description,
            scenes: store.scenes,
            edges: store.edges,
            variables: store.variables,
            settings: store.settings,
            version: store.version,
          }) : null}
          onApply={(data) => {
            store.loadScenario({
              name: data.name || store.name,
              description: data.description || store.description,
              scenes: data.scenes || store.scenes,
              edges: data.edges || store.edges,
              variables: data.variables || store.variables,
              settings: data.settings || store.settings,
            });
            store.addAuthorAchievement('first_scenario');
          }}
          onClose={() => store.setShowAiChat(false)}
        />
      )}

      {/* Live Preview */}
      {store.livePreviewSceneId && (
        <LivePreview
          scene={store.scenes.find((s) => s.id === store.livePreviewSceneId)!}
          allScenes={store.scenes}
          onClose={() => store.setLivePreviewScene(null)}
          onNavigate={(sceneId) => store.setLivePreviewScene(sceneId)}
        />
      )}

      {/* Toolbar Settings Modal */}
      {store.showToolbarSettings && (
        <ToolbarSettingsModal
          settings={store.toolbarSettings}
          onSave={(settings) => {
            store.setToolbarSettings(settings);
            store.saveToolbarSettings();
          }}
          onClose={() => store.setShowToolbarSettings(false)}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-scale-in p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Очистить всё?</h3>
              <p className="text-sm text-text-secondary">
                Вы уверены, что хотите удалить все блоки? Это действие можно отменить через Ctrl+Z.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  store.clearAll();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Manager Modal */}
      {showRoleManager && (
        <RoleManager onClose={() => setShowRoleManager(false)} />
      )}

      {/* Trigger Editor Modal */}
      {showTriggerEditor && (
        <TriggerEditor onClose={() => setShowTriggerEditor(false)} />

      {/* Parallel Scenario Manager Modal */}
      {showParallelManager && (
        <ParallelScenarioManager onClose={() => setShowParallelManager(false)} />
      )}
      )}
    </div>
  );
}

// ==================== Wrapper ====================
export default function ScenarioEditorV2(props: ScenarioEditorV2Props) {
  return (
    <ReactFlowProvider>
      <ScenarioEditorInner {...props} />
    </ReactFlowProvider>
  );
}