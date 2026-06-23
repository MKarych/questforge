'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getScenario, publishScenario, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScenarioEditor from '@/components/scenario-editor/ScenarioEditor';
import type { Node, Edge } from 'reactflow';
import type { ScenarioNodeData, GameSettings } from '@/types/scenario';

export default function EditScenarioPage() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const hasNavigatedRef = useRef(false);

  // Loaded data for ScenarioEditor
  const [initialName, setInitialName] = useState('');
  const [initialNodes, setInitialNodes] = useState<Node<ScenarioNodeData>[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [initialSettings, setInitialSettings] = useState<GameSettings | undefined>(undefined);

  useEffect(() => {
    async function loadScenario() {
      try {
        const response = await getScenario(scenarioId);
        const data = response.data as any;
        console.log('[EditPage] API response.data:', data);
        console.log('[EditPage] nodes from API:', data?.nodes);
        console.log('[EditPage] edges from API:', data?.edges);
        setScenario(data);
        setInitialName(data.name || '');

        // Restore nodes from backend JSON — ensure each node has required React Flow fields
        if (data.nodes && Array.isArray(data.nodes)) {
          console.log('[EditPage] Restoring nodes:', data.nodes.length);
          const restoredNodes = data.nodes.map((node: any) => ({
            ...node,
            // Ensure position exists (React Flow requires position.x and position.y)
            position: node.position || { x: 0, y: 0 },
            // Ensure type exists (React Flow uses it for nodeTypes lookup)
            type: node.type || 'TEXT',
            // Ensure data exists (ScenarioNode reads data.validationStatus, data.icon, data.label, etc.)
            data: node.data || { label: 'Узел', icon: '📄' },
          }));
          console.log('[EditPage] Restored nodes:', restoredNodes);
          setInitialNodes(restoredNodes);
        } else {
          console.log('[EditPage] No nodes in API response, data.nodes:', data?.nodes);
        }

        // Restore edges from backend JSON
        if (data.edges && Array.isArray(data.edges)) {
          console.log('[EditPage] Restoring edges:', data.edges.length);
          setInitialEdges(data.edges);
        } else {
          console.log('[EditPage] No edges in API response');
        }

        // Restore settings from backend JSON (stored in metadata)
        if (data.metadata) {
          let metadata = data.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch {}
          }
          if (metadata?.settings) {
            console.log('[EditPage] Restoring settings:', metadata.settings);
            setInitialSettings(metadata.settings);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарий';
        console.error('[EditPage] Load error:', err);
        setError(message);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    if (scenarioId) {
      loadScenario();
    }
  }, [scenarioId, router]);

  const handleNodesChange = useCallback(() => {
    if (!hasNavigatedRef.current) {
      setIsDirty(true);
    }
  }, []);

  const handleEdgesChange = useCallback(() => {
    if (!hasNavigatedRef.current) {
      setIsDirty(true);
    }
  }, []);

  const handleSave = async (data: any) => {
    if (!scenario) return;
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить сценарий';
      setError(message);
      setToast({ type: 'error', message: `❌ Ошибка: ${message}` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!scenario) return;
    setPublishing(true);
    setError(null);
    try {
      await publishScenario(scenarioId);
      setScenario(prev => prev ? { ...prev, isPublished: true } : null);
      setToast({ type: 'success', message: '✅ Сценарий опубликован' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось опубликовать сценарий';
      setError(message);
      setToast({ type: 'error', message: `❌ Ошибка: ${message}` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const handleExit = () => {
    if (isDirty) {
      setShowExitModal(true);
    } else {
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
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !scenario) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Сценарий не найден'}</p>
            <Link href="/organizer/scenarios" className="btn-primary">
              ← Назад к сценариям
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Top Bar with Exit Button */}
      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <button
          onClick={handleExit}
          className="btn-secondary text-sm flex items-center gap-1"
          title="Выйти в список сценариев"
        >
          ← Выйти
        </button>
        <div className="flex items-center gap-3">
          {!scenario?.isPublished && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? 'Публикация...' : '📢 Опубликовать'}
            </button>
          )}
          <span className="text-xs text-text-secondary">
            {isDirty ? '⚠️ Есть несохранённые изменения' : '✓ Изменений нет'}
          </span>
          <span className="text-xs text-text-secondary">
            v{scenario?.version || 1}
          </span>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        <ScenarioEditor
          scenarioName={initialName}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          initialSettings={initialSettings}
          isPublished={scenario?.isPublished ?? false}
          onSave={handleSave}
          onPublish={handlePublish}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
        />
      </div>
      {saving && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">💾</div>
              <div className="text-lg font-semibold text-text-primary">Сохранение...</div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        isOpen={showExitModal}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Выйти из редактора"
        message="Вы уверены, что хотите выйти? Все несохранённые изменения будут потеряны."
        confirmText="Выйти"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}
