"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditScenarioPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const client_1 = require("@/lib/api/client");
const Header_1 = __importDefault(require("@/components/ui/Header"));
const LoadingSpinner_1 = __importDefault(require("@/components/ui/LoadingSpinner"));
const ConfirmModal_1 = __importDefault(require("@/components/ui/ConfirmModal"));
const ScenarioEditor_1 = __importDefault(require("@/components/scenario-editor/ScenarioEditor"));
function EditScenarioPage() {
    const router = (0, navigation_1.useRouter)();
    const params = (0, navigation_1.useParams)();
    const scenarioId = params.id;
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [publishing, setPublishing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [scenario, setScenario] = (0, react_1.useState)(null);
    const [showExitModal, setShowExitModal] = (0, react_1.useState)(false);
    const [isDirty, setIsDirty] = (0, react_1.useState)(false);
    const [toast, setToast] = (0, react_1.useState)(null);
    const hasNavigatedRef = (0, react_1.useRef)(false);
    // Loaded data for ScenarioEditor — starts as undefined (not loaded yet)
    const [loadedData, setLoadedData] = (0, react_1.useState)(null);
    // Key to force ScenarioEditor remount when data changes
    const [editorKey, setEditorKey] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        async function loadScenario() {
            try {
                const response = await (0, client_1.getScenario)(scenarioId);
                const data = response.data;
                setScenario(data);
                // Restore nodes from backend JSON — ensure each node has required React Flow fields
                let restoredNodes = [];
                if (data.nodes && Array.isArray(data.nodes)) {
                    restoredNodes = data.nodes.map((node) => ({
                        ...node,
                        position: node.position || { x: 0, y: 0 },
                        type: node.type || 'TEXT',
                        data: node.data || { label: 'Узел', icon: '📄' },
                    }));
                }
                // Restore edges from backend JSON
                let restoredEdges = [];
                if (data.edges && Array.isArray(data.edges)) {
                    restoredEdges = data.edges;
                }
                // Restore settings from backend JSON (stored in metadata)
                let restoredSettings;
                if (data.metadata) {
                    let metadata = data.metadata;
                    if (typeof metadata === 'string') {
                        try {
                            metadata = JSON.parse(metadata);
                        }
                        catch { }
                    }
                    if (metadata?.settings) {
                        restoredSettings = metadata.settings;
                    }
                }
                // Set all loaded data at once — ScenarioEditor will mount with complete data
                setLoadedData({
                    name: data.name || '',
                    nodes: restoredNodes,
                    edges: restoredEdges,
                    settings: restoredSettings,
                });
                // Force ScenarioEditor to remount with new data (useNodesState only reads initial value once)
                setEditorKey(prev => prev + 1);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарий';
                setError(message);
                if (err instanceof Error && err.message.includes('401')) {
                    router.push('/auth/login');
                }
            }
            finally {
                setLoading(false);
            }
        }
        if (scenarioId) {
            loadScenario();
        }
    }, [scenarioId, router]);
    const handleNodesChange = (0, react_1.useCallback)(() => {
        if (!hasNavigatedRef.current) {
            setIsDirty(true);
        }
    }, []);
    const handleEdgesChange = (0, react_1.useCallback)(() => {
        if (!hasNavigatedRef.current) {
            setIsDirty(true);
        }
    }, []);
    const handleSave = async (data) => {
        if (!scenario)
            return;
        hasNavigatedRef.current = true;
        setSaving(true);
        setError(null);
        setToast(null);
        try {
            const token = localStorage.getItem('auth_token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: data.name,
                    nodes: data.nodes,
                    edges: data.edges,
                    startNodeId: data.startNodeId,
                    metadata: {
                        settings: data.settings,
                    },
                }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Ошибка при сохранении сценария');
            }
            const result = await response.json();
            // Response is wrapped in { success: true, data: { ... } } by TransformInterceptor
            const scenarioData = result?.data || result;
            setScenario(prev => prev ? { ...prev, ...scenarioData } : null);
            setIsDirty(false);
            setToast({ type: 'success', message: '✅ Сценарий сохранён' });
            setTimeout(() => setToast(null), 3000);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Не удалось сохранить сценарий';
            setError(message);
            setToast({ type: 'error', message: `❌ Ошибка: ${message}` });
            setTimeout(() => setToast(null), 5000);
        }
        finally {
            setSaving(false);
        }
    };
    const handlePublish = async () => {
        if (!scenario)
            return;
        setPublishing(true);
        setError(null);
        try {
            await (0, client_1.publishScenario)(scenarioId);
            setScenario(prev => prev ? { ...prev, isPublished: true } : null);
            setToast({ type: 'success', message: '✅ Сценарий опубликован' });
            setTimeout(() => setToast(null), 3000);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Не удалось опубликовать сценарий';
            setError(message);
            setToast({ type: 'error', message: `❌ Ошибка: ${message}` });
            setTimeout(() => setToast(null), 5000);
        }
        finally {
            setPublishing(false);
        }
    };
    const handleExit = () => {
        if (isDirty) {
            setShowExitModal(true);
        }
        else {
            router.push('/organizer/scenarios');
        }
    };
    const handleConfirmExit = () => {
        router.push('/organizer/scenarios');
    };
    const handleCancelExit = () => {
        setShowExitModal(false);
    };
    if (loading) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner_1.default size="lg"/>
        </div>
      </div>);
    }
    if (error && !scenario) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Сценарий не найден'}</p>
            <link_1.default href="/organizer/scenarios" className="btn-primary">
              ← Назад к сценариям
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen">
      <Header_1.default />

      {/* Top Bar with Exit Button */}
      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <button onClick={handleExit} className="btn-secondary text-sm flex items-center gap-1" title="Выйти в список сценариев">
          ← Выйти
        </button>
        <div className="flex items-center gap-3">
          {!scenario?.isPublished && (<button onClick={handlePublish} disabled={publishing} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {publishing ? 'Публикация...' : '📢 Опубликовать'}
            </button>)}
          <span className="text-xs text-text-secondary">
            {isDirty ? '⚠️ Есть несохранённые изменения' : '✓ Изменений нет'}
          </span>
          <span className="text-xs text-text-secondary">
            v{scenario?.version || 1}
          </span>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (<div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>)}

      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        {/* key={editorKey} forces ScenarioEditor to remount when data loads (useNodesState only reads initial value once) */}
        {loadedData && (<ScenarioEditor_1.default key={editorKey} scenarioName={loadedData.name} initialNodes={loadedData.nodes} initialEdges={loadedData.edges} initialSettings={loadedData.settings} isPublished={scenario?.isPublished ?? false} onSave={handleSave} onPublish={handlePublish} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}/>)}
      </div>
      {saving && (<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">💾</div>
              <div className="text-lg font-semibold text-text-primary">Сохранение...</div>
            </div>
          </div>
        </div>)}

      {/* Exit Confirmation Modal */}
      <ConfirmModal_1.default isOpen={showExitModal} onClose={handleCancelExit} onConfirm={handleConfirmExit} title="Выйти из редактора" message="Вы уверены, что хотите выйти? Все несохранённые изменения будут потеряны." confirmText="Выйти" cancelText="Отмена" variant="danger"/>
    </div>);
}
//# sourceMappingURL=page.js.map