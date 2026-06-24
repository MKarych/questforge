'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import { BlockDefinition, BLOCK_DEFINITIONS, MissionType, Scene } from '@/lib/editor-store/editor.types';
import BlockPalette from './BlockPalette';
import NodeSettings from './NodeSettings';
import VariablesPanel from './VariablesPanel';
import PreviewModal from './PreviewModal';
import TestModal from './TestModal';
import EditorNodeComponent from './EditorNode';
import AssetPanel from './AssetPanel';
import LivePreview from './LivePreview';
import ScenarioTemplatesModal from './ScenarioTemplatesModal';
import AIAssistant from './AIAssistant';
import AuthorAchievements from './AuthorAchievements';
import AiEnhanceModal from './AiEnhanceModal';
import ToolbarSettingsModal from './ToolbarSettingsModal';
import { autoSaveManager } from '@/lib/editor-store/autosave';

// ==================== Node Types for React Flow ====================
const nodeTypes = {
  location: EditorNodeComponent,
  quiz: EditorNodeComponent,
  dialogue: EditorNodeComponent,
  conference: EditorNodeComponent,
  rpg: EditorNodeComponent,
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
  default: CustomEdge,
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
  const store = useEditorStore();
  const initialized = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  // Convert Scene[] to React Flow Node[]
  const rfNodes: Node[] = useMemo(
    () =>
      store.scenes.map((s) => ({
        id: s.id,
        type: s.type,
        position: s.position,
        data: s,
      })),
    [store.scenes]
  );

  // Convert Edge[] to React Flow Edge[]
  const rfEdges: Edge[] = useMemo(
    () =>
      store.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'default',
        animated: e.animated,
        data: e.data,
      })),
    [store.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync store -> React Flow
  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);

  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  // Auto-validate on scenes/edges change
  useEffect(() => {
    store.validate();
  }, [store.scenes, store.edges]);

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
  }, [store.selectedNodes, store.selectedEdges]);

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
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      store.addScene(block.type, position, block.label);
    },
    [store]
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
      }
    },
    [store]
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
      onSave({
        name: store.name,
        description: store.description,
        scenes: store.scenes,
        edges: store.edges,
        startSceneId: store.scenes.find((s) => s.title === 'Старт')?.id,
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

  // Show templates modal on first load if empty
  useEffect(() => {
    if (isEmpty && store.scenes.length === 0 && !store.showTemplates) {
      store.setShowTemplates(true);
    }
  }, []);

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
          {/* Validation indicator */}
          {hasErrors && (
            <span className="text-[10px] text-error bg-error/10 px-1.5 py-0.5 rounded">
              ⚠️{store.validationResult.errors.length}
            </span>
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

          {/* ✨ AI Доработка */}
          <button onClick={() => store.setShowAiEnhance(true)}
            className={tbBtn('bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/20')}
            title="Доработать сценарий с AI"
          >
            {tbContent('✨', 'AI Дор')}
          </button>

          {/* ✨ AI Assistant (генерация) */}
          <button onClick={() => store.setShowAIAssistant(true)}
            className={tbBtn('bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border-primary/20')}
            title="AI-помощник"
          >
            {tbContent('🤖', 'AI')}
          </button>

          <button onClick={() => store.togglePanel('variables')}
            className={`${tbBtn()} ${store.openPanels.variables ? 'bg-primary/20' : ''}`}
            title="Переменные"
          >
            {tbContent('📊', 'Перем')}
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
          <button onClick={() => store.setShowToolbarSettings(true)}
            className={tbBtn()}
            title="Настройки панели инструментов"
          >
            ⚙️
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

      {/* Validation Errors Bar */}
      {hasErrors && store.openPanels.validation && (
        <div className="bg-error/10 border-b border-error/30 px-4 py-2 max-h-32 overflow-y-auto">
          <div className="flex items-center gap-2 text-error text-sm mb-1">
            <span>⚠️</span>
            <span>
              {store.validationResult.errors.filter((e) => e.severity === 'error').length} ошибок,{' '}
              {store.validationResult.errors.filter((e) => e.severity === 'warning').length} предупреждений
            </span>
          </div>
          <div className="space-y-1">
            {store.validationResult.errors.map((err, idx) => (
              <div key={idx} className="text-xs text-text-secondary flex items-center gap-2">
                <span className={err.severity === 'error' ? 'text-error' : 'text-yellow-500'}>
                  {err.severity === 'error' ? '❌' : '⚠️'}
                </span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex">
        {/* Block Palette */}
        <BlockPalette onDragStart={onDragStart} />

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
            key={store.flowKey}
            nodes={nodes}
            edges={edges}
            nodesDraggable={true}
            elementsSelectable={true}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              // Sync position changes back to store
              for (const change of changes) {
                if (change.type === 'position' && change.position && change.id) {
                  store.moveScene(change.id, change.position);
                }
              }
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              // Sync edge deletions
              for (const change of changes) {
                if (change.type === 'remove' && change.id) {
                  store.removeEdge(change.id);
                }
              }
            }}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
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
              },
            });
            store.setShowTemplates(false);
            store.addAuthorAchievement('first_scenario');
          }}
          onClose={() => store.setShowTemplates(false)}
        />
      )}

      {/* AI Assistant Modal */}
      {store.showAIAssistant && (
        <AIAssistant
          onGenerate={(prompt) => {
            // Создаём простую структуру на основе промпта
            const startScene: Scene = {
              id: 'ai-start',
              type: 'location',
              title: 'Старт',
              description: prompt,
              missions: [{
                id: 'ai-mission-1',
                type: 'text',
                title: 'Начало',
                description: 'Напишите "готов" чтобы начать',
                config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 },
                rewards: [],
                conditions: [],
                hints: [],
              }],
              metadata: {},
              view: { type: 'list', config: {} },
              position: { x: 100, y: 100 },
              transitions: [],
            };
            const finishScene: Scene = {
              id: 'ai-finish',
              type: 'location',
              title: 'Финиш',
              description: 'Сценарий завершён!',
              missions: [],
              metadata: {},
              view: { type: 'list', config: {} },
              position: { x: 400, y: 100 },
              transitions: [],
            };
            store.loadScenario({
              name: `AI: ${prompt.slice(0, 40)}...`,
              description: prompt,
              scenes: [startScene, finishScene],
              edges: [{ id: 'ai-edge-1', source: startScene.id, target: finishScene.id, type: 'auto' }],
              variables: [],
              settings: {
                totalTime: 0,
                defaultPoints: 10,
                defaultPenalty: 0,
                hintLimit: 3,
                maxAttempts: 3,
                variables: [],
              },
            });
            store.setShowAIAssistant(false);
            store.addAuthorAchievement('first_scenario');
          }}
          onClose={() => store.setShowAIAssistant(false)}
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

      {/* AI Enhance Modal */}
      {store.showAiEnhance && (
        <AiEnhanceModal
          scenarioJson={JSON.stringify({
            id: store.scenarioId || '',
            name: store.name,
            description: store.description,
            scenes: store.scenes,
            edges: store.edges,
            variables: store.variables,
            settings: store.settings,
            version: store.version,
          })}
          onApply={(data) => {
            store.loadScenario({
              name: data.name || store.name,
              description: data.description || store.description,
              scenes: data.scenes || store.scenes,
              edges: data.edges || store.edges,
              variables: data.variables || store.variables,
              settings: data.settings || store.settings,
            });
          }}
          onClose={() => store.setShowAiEnhance(false)}
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