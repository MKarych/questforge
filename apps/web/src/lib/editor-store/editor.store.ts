// ============================================================
// Editor Store — Zustand Store для редактора сценариев
// По спецификации docs/49 (раздел 7.2) и docs/50
// ============================================================

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Scene,
  Edge,
  EditorState,
  EditorSnapshot,
  TestState,
  VariableDefinition,
  GameSettings,
  Mission,
  SceneType,
  MissionType,
  MissionConfig,
  Condition,
  BLOCK_DEFINITIONS,
  ToolbarSettings,
} from './editor.types';
import { validationEngine } from '../editor-validation/validation-engine';
import { autoSaveManager, AutoSaveData } from './autosave';

// ==================== Actions Interface ====================
export interface EditorActions {
  // Scenario
  setScenarioId: (id: string) => void;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  setVersion: (v: number) => void;

  // Scenes
  addScene: (type: SceneType, position: { x: number; y: number }, title?: string) => void;
  updateScene: (sceneId: string, data: Partial<Scene>) => void;
  removeScene: (sceneId: string) => void;
  moveScene: (sceneId: string, position: { x: number; y: number }) => void;
  setScenes: (scenes: Scene[]) => void;

  // Missions
  addMission: (sceneId: string, type: MissionType) => void;
  updateMission: (sceneId: string, missionId: string, data: Partial<Mission>) => void;
  removeMission: (sceneId: string, missionId: string) => void;

  // Transitions (Edges)
  addEdge: (source: string, target: string, condition?: Condition) => void;
  removeEdge: (edgeId: string) => void;
  setEdges: (edges: Edge[]) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  selectMultiple: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // Viewport
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Clipboard
  copyNodes: (nodeIds: string[]) => void;
  pasteNodes: () => void;
  cutNodes: (nodeIds: string[]) => void;

  // Variables
  addVariable: () => void;
  updateVariable: (index: number, data: Partial<VariableDefinition>) => void;
  removeVariable: (index: number) => void;
  setVariables: (vars: VariableDefinition[]) => void;

  // Settings
  setSettings: (settings: Partial<GameSettings>) => void;

  // Validation
  validate: () => void;

  // Panels
  togglePanel: (panel: keyof EditorState['openPanels']) => void;
  setPanel: (panel: keyof EditorState['openPanels'], open: boolean) => void;

  // Mode
  setMode: (mode: 'edit' | 'preview' | 'test') => void;

  // Preview
  setPreviewScene: (sceneId: string | null) => void;

  // Test
  startTest: () => void;
  testAnswer: (answer: string) => void;
  testRestart: () => void;
  stopTest: () => void;

  // AutoSave
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  clearAutoSave: () => void;

  // Load
  loadScenario: (data: {
    id?: string;
    name: string;
    description?: string;
    scenes: Scene[];
    edges: Edge[];
    variables: VariableDefinition[];
    settings: GameSettings;
    version?: number;
  }) => void;

  // Reset
  reset: () => void;

  // UX features
  setShowTemplates: (show: boolean) => void;
  setShowAIAssistant: (show: boolean) => void;
  setShowAiEnhance: (show: boolean) => void;
  setShowToolbarSettings: (show: boolean) => void;
  setLivePreviewScene: (sceneId: string | null) => void;
  setToolbarSettings: (settings: ToolbarSettings) => void;
  clearAll: () => void;
  addAuthorAchievement: (achievementId: string) => void;
  dismissNewAchievements: () => void;
}

// ==================== Initial State ====================
const initialSettings: GameSettings = {
  totalTime: 0,
  defaultPoints: 10,
  defaultPenalty: 0,
  hintLimit: 3,
  maxAttempts: 3,
  variables: [],
};

const createInitialState = (): EditorState => ({
  scenarioId: null,
  version: 1,
  lastSavedAt: null,
  isDirty: false,

  name: '',
  description: '',
  scenes: [],
  edges: [],
  variables: [],
  settings: { ...initialSettings },

  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodes: [],
  selectedEdges: [],

  history: {
    undoStack: [],
    redoStack: [],
    maxHistory: 50,
  },

  clipboard: null,

  openPanels: {
    properties: true,
    variables: false,
    validation: false,
    debugger: false,
  },

  validationResult: { valid: true, errors: [], warnings: [] },

  mode: 'edit',
  previewSceneId: null,
  testState: null,

  // UX features
  showTemplates: false,
  showAIAssistant: false,
  showAiEnhance: false,
  showToolbarSettings: false,
  livePreviewSceneId: null,
  authorAchievements: [],
  newAchievementAlerts: [],
  toolbarSettings: { size: 'medium', display: 'icon_label' },
  flowKey: 0,
});

// ==================== Store ====================
export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...createInitialState(),

  // ==================== Scenario ====================
  setScenarioId: (id) => set({ scenarioId: id }),
  setName: (name) => set({ name, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),
  setVersion: (version) => set({ version }),

  // ==================== Scenes ====================
  addScene: (type, position, title) => {
    get().pushHistory();

    const newScene: Scene = {
      id: uuidv4(),
      type,
      title: title || BLOCK_DEFINITIONS.find(b => b.type === type)?.label || 'Новая сцена',
      description: '',
      view: { type: 'card', config: { layout: 'vertical', interactive: true } },
      missions: [],
      transitions: [],
      position,
      metadata: {},
    };

    set((state) => ({
      scenes: [...state.scenes, newScene],
      isDirty: true,
    }));
  },

  updateScene: (sceneId, data) => {
    get().pushHistory();

    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...data } : s
      ),
      isDirty: true,
    }));
  },

  removeScene: (sceneId) => {
    get().pushHistory();

    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== sceneId),
      edges: state.edges.filter((e) => e.source !== sceneId && e.target !== sceneId),
      selectedNodes: [],
      isDirty: true,
    }));
  },

  moveScene: (sceneId, position) => {
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, position } : s
      ),
    }));
  },

  setScenes: (scenes) => set({ scenes, isDirty: true }),

  // ==================== Missions ====================
  addMission: (sceneId, type) => {
    get().pushHistory();

    const newMission: Mission = {
      id: uuidv4(),
      type,
      title: 'Новое задание',
      description: '',
      config: getDefaultMissionConfig(type),
      rewards: [],
      conditions: [],
      hints: [],
    };

    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, missions: [...s.missions, newMission] }
          : s
      ),
      isDirty: true,
    }));
  },

  updateMission: (sceneId, missionId, data) => {
    get().pushHistory();

    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              missions: s.missions.map((m) =>
                m.id === missionId ? { ...m, ...data } : m
              ),
            }
          : s
      ),
      isDirty: true,
    }));
  },

  removeMission: (sceneId, missionId) => {
    get().pushHistory();

    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, missions: s.missions.filter((m) => m.id !== missionId) }
          : s
      ),
      isDirty: true,
    }));
  },

  // ==================== Edges ====================
  addEdge: (source, target, condition) => {
    get().pushHistory();

    const newEdge: Edge = {
      id: uuidv4(),
      source,
      target,
      animated: true,
      data: {
        condition,
        label: condition ? 'Условие' : 'Всегда',
        transitionType: condition ? 'conditional' : 'auto',
      },
    };

    set((state) => ({
      edges: [...state.edges, newEdge],
      isDirty: true,
    }));
  },

  removeEdge: (edgeId) => {
    get().pushHistory();

    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      selectedEdges: [],
      isDirty: true,
    }));
  },

  setEdges: (edges) => set({ edges, isDirty: true }),

  // ==================== Selection ====================
  selectNode: (nodeId) =>
    set({
      selectedNodes: nodeId ? [nodeId] : [],
      selectedEdges: [],
    }),

  selectEdge: (edgeId) =>
    set({
      selectedEdges: edgeId ? [edgeId] : [],
      selectedNodes: [],
    }),

  selectMultiple: (nodeIds) =>
    set({ selectedNodes: nodeIds, selectedEdges: [] }),

  clearSelection: () =>
    set({ selectedNodes: [], selectedEdges: [] }),

  // ==================== Viewport ====================
  setViewport: (viewport) => set({ viewport }),

  // ==================== History ====================
  pushHistory: () => {
    const state = get();
    const snapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(state.scenes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      variables: JSON.parse(JSON.stringify(state.variables)),
      timestamp: Date.now(),
    };

    const undoStack = [...state.history.undoStack, snapshot];
    if (undoStack.length > state.history.maxHistory) {
      undoStack.shift();
    }

    set({
      history: {
        ...state.history,
        undoStack,
        redoStack: [],
      },
    });
  },

  undo: () => {
    const state = get();
    if (state.history.undoStack.length === 0) return;

    const currentSnapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(state.scenes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      variables: JSON.parse(JSON.stringify(state.variables)),
      timestamp: Date.now(),
    };

    const undoStack = [...state.history.undoStack];
    const previous = undoStack.pop()!;
    const redoStack = [...state.history.redoStack, currentSnapshot];

    set({
      scenes: previous.scenes,
      edges: previous.edges,
      variables: previous.variables,
      history: { ...state.history, undoStack, redoStack },
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    if (state.history.redoStack.length === 0) return;

    const currentSnapshot: EditorSnapshot = {
      scenes: JSON.parse(JSON.stringify(state.scenes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      variables: JSON.parse(JSON.stringify(state.variables)),
      timestamp: Date.now(),
    };

    const redoStack = [...state.history.redoStack];
    const next = redoStack.pop()!;
    const undoStack = [...state.history.undoStack, currentSnapshot];

    set({
      scenes: next.scenes,
      edges: next.edges,
      variables: next.variables,
      history: { ...state.history, undoStack, redoStack },
      isDirty: true,
    });
  },

  // ==================== Clipboard ====================
  copyNodes: (nodeIds) => {
    const state = get();
    const scenesToCopy = state.scenes.filter((s) => nodeIds.includes(s.id));
    const nodeIdSet = new Set(nodeIds);
    const edgesToCopy = state.edges.filter(
      (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
    );

    set({
      clipboard: {
        scenes: JSON.parse(JSON.stringify(scenesToCopy)),
        edges: JSON.parse(JSON.stringify(edgesToCopy)),
      },
    });
  },

  pasteNodes: () => {
    const state = get();
    if (!state.clipboard) return;

    state.pushHistory();

    const idMap = new Map<string, string>();
    const newScenes: Scene[] = state.clipboard.scenes.map((scene) => {
      const newId = uuidv4();
      idMap.set(scene.id, newId);
      return {
        ...scene,
        id: newId,
        position: {
          x: scene.position.x + 50,
          y: scene.position.y + 50,
        },
      };
    });

    const newEdges: Edge[] = state.clipboard.edges.map((edge) => ({
      ...edge,
      id: uuidv4(),
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    set((s) => ({
      scenes: [...s.scenes, ...newScenes],
      edges: [...s.edges, ...newEdges],
      isDirty: true,
    }));
  },

  cutNodes: (nodeIds) => {
    const state = get();
    state.copyNodes(nodeIds);

    const nodeIdSet = new Set(nodeIds);
    set((s) => ({
      scenes: s.scenes.filter((n) => !nodeIdSet.has(n.id)),
      edges: s.edges.filter(
        (e) => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target)
      ),
      selectedNodes: [],
      isDirty: true,
    }));
  },

  // ==================== Variables ====================
  addVariable: () => {
    const newVar: VariableDefinition = {
      name: '',
      type: 'number',
      defaultValue: 0,
      scope: 'local',
    };

    set((state) => ({
      variables: [...state.variables, newVar],
      isDirty: true,
    }));
  },

  updateVariable: (index, data) => {
    set((state) => {
      const vars = [...state.variables];
      if (index >= 0 && index < vars.length) {
        vars[index] = { ...vars[index], ...data };
      }
      return { variables: vars, isDirty: true };
    });
  },

  removeVariable: (index) => {
    set((state) => {
      const vars = [...state.variables];
      vars.splice(index, 1);
      return { variables: vars, isDirty: true };
    });
  },

  setVariables: (variables) => set({ variables }),

  // ==================== Settings ====================
  setSettings: (settings) => {
    set((state) => ({
      settings: { ...state.settings, ...settings },
      isDirty: true,
    }));
  },

  // ==================== Validation ====================
  validate: () => {
    const state = get();
    const result = validationEngine.validate(state.scenes, state.edges);
    set({ validationResult: result });
  },

  // ==================== Panels ====================
  togglePanel: (panel) => {
    set((state) => ({
      openPanels: {
        ...state.openPanels,
        [panel]: !state.openPanels[panel],
      },
    }));
  },

  setPanel: (panel, open) => {
    set((state) => ({
      openPanels: { ...state.openPanels, [panel]: open },
    }));
  },

  // ==================== Mode ====================
  setMode: (mode) => set({ mode }),

  // ==================== Preview ====================
  setPreviewScene: (sceneId) => set({ previewSceneId: sceneId }),

  // ==================== Test ====================
  startTest: () => {
    const state = get();
    const startScene = state.scenes.find((s) => s.title === 'Старт');

    const testState: TestState = {
      currentSceneId: startScene?.id || null,
      variables: {},
      score: 0,
      inventory: { items: [], capacity: 100 },
      achievements: [],
      log: [{ type: 'info', message: '🧪 Тестирование начато', timestamp: Date.now() }],
      finished: false,
    };

    set({ mode: 'test', testState });
  },

  testAnswer: (answer) => {
    const state = get();
    const testState = state.testState;
    if (!testState || testState.finished) return;

    const currentScene = state.scenes.find((s) => s.id === testState.currentSceneId);
    if (!currentScene) return;

    const newLog = [...testState.log];
    let newScore = testState.score;
    let nextSceneId: string | null = null;

    // Find outgoing edges
    const outgoingEdges = state.edges.filter((e) => e.source === testState.currentSceneId);

    // Process based on mission type
    for (const mission of currentScene.missions) {
      const isCorrect = checkMissionAnswer(mission, answer);
      if (isCorrect) {
        newScore += 10;
        newLog.push({
          type: 'success',
          message: `✅ Миссия "${mission.title}" выполнена! +10 очков`,
          timestamp: Date.now(),
        });
      } else {
        newLog.push({
          type: 'fail',
          message: `❌ Миссия "${mission.title}" провалена`,
          timestamp: Date.now(),
        });
      }
    }

    // Follow first edge
    if (outgoingEdges.length > 0) {
      nextSceneId = outgoingEdges[0].target;
    }

    // Check if finished
    const nextScene = state.scenes.find((s) => s.id === nextSceneId);
    if (nextScene?.title === 'Финиш' || !nextSceneId) {
      newLog.push({
        type: 'info',
        message: `🏁 Сценарий пройден! Итоговый счёт: ${newScore}`,
        timestamp: Date.now(),
      });
      set({
        testState: {
          ...testState,
          currentSceneId: null,
          score: newScore,
          log: newLog,
          finished: true,
        },
      });
    } else {
      set({
        testState: {
          ...testState,
          currentSceneId: nextSceneId,
          score: newScore,
          log: newLog,
        },
      });
    }
  },

  testRestart: () => {
    get().startTest();
  },

  stopTest: () => {
    set({ mode: 'edit', testState: null });
  },

  // ==================== AutoSave ====================
  saveToLocalStorage: () => {
    const state = get();
    const data: AutoSaveData = {
      scenarioId: state.scenarioId,
      name: state.name,
      description: state.description,
      scenes: state.scenes,
      edges: state.edges,
      variables: state.variables,
      settings: state.settings,
      viewport: state.viewport,
      timestamp: Date.now(),
    };
    autoSaveManager.saveToLocalStorage(data);
  },

  loadFromLocalStorage: () => {
    const data = autoSaveManager.loadFromLocalStorage();
    if (!data) return false;

    set({
      scenarioId: data.scenarioId,
      name: data.name,
      description: data.description,
      scenes: data.scenes,
      edges: data.edges,
      variables: data.variables,
      settings: data.settings,
      viewport: data.viewport,
      isDirty: true,
    });
    return true;
  },

  clearAutoSave: () => {
    autoSaveManager.clearLocalStorage();
  },

  // ==================== Load ====================
  loadScenario: (data) => {
    set((state) => ({
      scenarioId: data.id || null,
      name: data.name,
      description: data.description || '',
      scenes: data.scenes,
      edges: data.edges,
      variables: data.variables,
      settings: data.settings,
      version: data.version || 1,
      isDirty: false,
      lastSavedAt: new Date(),
      history: { undoStack: [], redoStack: [], maxHistory: 50 },
      validationResult: { valid: true, errors: [], warnings: [] },
      flowKey: state.flowKey + 1,
    }));
  },

  // ==================== Reset ====================
  reset: () => {
    set(createInitialState());
  },

  // ==================== UX Features ====================
  setShowTemplates: (show) => set({ showTemplates: show }),
  setShowAIAssistant: (show) => set({ showAIAssistant: show }),
  setShowAiEnhance: (show) => set({ showAiEnhance: show }),
  setShowToolbarSettings: (show) => set({ showToolbarSettings: show }),
  setLivePreviewScene: (sceneId) => set({ livePreviewSceneId: sceneId }),
  setToolbarSettings: (settings) => set({ toolbarSettings: settings }),

  // ==================== Clear All ====================
  clearAll: () => {
    get().pushHistory();
    const startId = `scene-${Date.now()}-start`;
    const finishId = `scene-${Date.now()}-finish`;
    const startScene: Scene = {
      id: startId,
      type: 'location',
      title: 'Старт',
      description: 'Начало сценария',
      missions: [],
      metadata: {},
      view: { type: 'list', config: {} },
      position: { x: 100, y: 200 },
      transitions: [],
    };
    const finishScene: Scene = {
      id: finishId,
      type: 'location',
      title: 'Финиш',
      description: 'Конец сценария',
      missions: [],
      metadata: {},
      view: { type: 'list', config: {} },
      position: { x: 500, y: 200 },
      transitions: [],
    };
    set({
      scenes: [startScene, finishScene],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      validationResult: { valid: true, errors: [], warnings: [] },
      flowKey: get().flowKey + 1,
    });
  },
  addAuthorAchievement: (achievementId) => {
    const state = get();
    const alreadyHas = state.authorAchievements.some((a) => a.id === achievementId);
    if (alreadyHas) return;
    const newAchievement = { id: achievementId, unlockedAt: Date.now() };
    set({
      authorAchievements: [...state.authorAchievements, newAchievement],
      newAchievementAlerts: [...state.newAchievementAlerts, newAchievement],
    });
  },
  dismissNewAchievements: () => set({ newAchievementAlerts: [] }),
}));

// ==================== Helpers ====================
function getDefaultMissionConfig(type: MissionType): MissionConfig {
  switch (type) {
    case 'text':
      return { correctAnswer: '', matchMode: 'exact', maxAttempts: 3 };
    case 'code':
      return { correctCode: '', maxAttempts: 3 };
    case 'photo':
      return { requirements: '', validationType: 'manual' };
    case 'gps':
      return { lat: 0, lng: 0, radius: 50 };
    case 'qr':
      return { data: '' };
    case 'choice':
      return { options: ['', ''], correctIndex: 0, shuffle: false };
    case 'collect':
      return { itemId: '', itemName: '', quantity: 1 };
    case 'dialogue':
      return { npcName: '', npcDescription: '', dialogues: [] };
    case 'audio':
      return { assetId: '', autoPlay: false, loop: false };
    case 'video':
      return { assetId: '', autoPlay: false, loop: false };
    case 'image':
      return { assetId: '', caption: '' };
    case 'inventory_get':
      return { itemId: '', itemName: '', quantity: 1 };
    case 'inventory_spend':
      return { itemId: '', itemName: '', quantity: 1 };
    case 'inventory_check':
      return { itemId: '', itemName: '', quantity: 1, consumeOnCheck: false };
    case 'achievement':
      return { achievementId: '', achievementName: '', achievementDescription: '', icon: '' };
    default:
      return { correctAnswer: '', matchMode: 'exact', maxAttempts: 3 };
  }
}

function checkMissionAnswer(mission: Mission, answer: string): boolean {
  switch (mission.type) {
    case 'text': {
      const cfg = mission.config as any;
      if (!cfg.correctAnswer) return true;
      if (cfg.matchMode === 'case_insensitive') {
        return answer.toLowerCase().trim() === cfg.correctAnswer.toLowerCase().trim();
      }
      if (cfg.matchMode === 'regex') {
        try {
          return new RegExp(cfg.correctAnswer).test(answer);
        } catch {
          return false;
        }
      }
      return answer.trim() === cfg.correctAnswer.trim();
    }
    case 'code': {
      const cfg = mission.config as any;
      if (!cfg.correctCode) return true;
      return answer.trim() === cfg.correctCode.trim();
    }
    case 'choice': {
      const cfg = mission.config as any;
      return parseInt(answer) === cfg.correctIndex;
    }
    case 'inventory_check': {
      // В тестовом режиме считаем, что предмет есть, если ответ 'yes'
      return answer === 'yes';
    }
    // Медиа-типы, инвентарь (get/spend), achievement — auto-complete
    case 'audio':
    case 'video':
    case 'image':
    case 'inventory_get':
    case 'inventory_spend':
    case 'achievement':
      return true;
    default:
      return true;
  }
}