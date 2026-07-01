'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScenarioEditorV2 from '@/components/editor-v2/ScenarioEditor';
import { EditorNode, Edge, VariableDefinition, GameSettings } from '@/lib/editor-store/editor.types';

export default function EditScenarioV2Page() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const hasNavigatedRef = useRef(false);

  // Loaded data
  const [loadedData, setLoadedData] = useState<{
    name: string;
    description: string;
    nodes: EditorNode[];
    edges: Edge[];
    variables: VariableDefinition[];
    settings: GameSettings;
  } | null>(null);

  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    async function loadScenario() {
      try {
        const token = localStorage.getItem('auth_token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

        const response = await fetch(`${API_URL}/scenarios/${scenarioId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить сценарий');
        }

        const result = await response.json();
        const data = result?.data || result;

        setScenario(data);

        // Restore nodes
        let restoredNodes: EditorNode[] = [];
        if (data.nodes && Array.isArray(data.nodes)) {
          restoredNodes = data.nodes.map((node: any) => ({
            ...node,
            position: node.position || { x: 0, y: 0 },
            type: node.type || 'location',
            missions: node.missions || [],
            transitions: node.transitions || [],
            metadata: node.metadata || {},
          }));
        }

        // Restore edges
        let restoredEdges: Edge[] = [];
        if (data.edges && Array.isArray(data.edges)) {
          restoredEdges = data.edges;
        }

        // Restore settings
        let restoredSettings: GameSettings = {
          totalTime: 0,
          defaultPoints: 10,
          defaultPenalty: 0,
          hintLimit: 3,
          maxAttempts: 3,
          variables: [],
          roles: [],
        };

        let restoredVariables: VariableDefinition[] = [];

        if (data.metadata) {
          let metadata = data.metadata;
          if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch {}
          }
          if (metadata?.settings) {
            restoredSettings = { ...restoredSettings, ...metadata.settings };
          }
          if (metadata?.variables) {
            restoredVariables = metadata.variables;
          }
        }

        setLoadedData({
          name: data.name || '',
          description: data.description || '',
          nodes: restoredNodes,
          edges: restoredEdges,
          variables: restoredVariables,
          settings: restoredSettings,
        });
        setEditorKey((prev) => prev + 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарий';
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
          description: data.description || '',
          nodes: data.nodes,
          edges: data.edges,
          startNodeId: data.startNodeId,
          metadata: {
            settings: data.settings,
            variables: data.variables,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Ошибка при сохранении сценария');
      }

      const result = await response.json();
      const scenarioData = result?.data || result;
      setScenario((prev: any) => (prev ? { ...prev, ...scenarioData } : null));
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
      const token = localStorage.getItem('auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${API_URL}/scenarios/${scenarioId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось опубликовать сценарий');
      }

      setScenario((prev: any) => (prev ? { ...prev, isPublished: true } : null));
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

      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <button onClick={handleExit} className="btn-secondary text-sm flex items-center gap-1">
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
          <span className="text-xs text-text-secondary">v{scenario?.version || 1}</span>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        {loadedData && (
          <ScenarioEditorV2
            key={editorKey}
            scenarioId={scenarioId}
            initialName={loadedData.name}
            initialDescription={loadedData.description}
            isPublished={scenario?.isPublished ?? false}
            onSave={handleSave}
            onPublish={handlePublish}
          />
        )}
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

      <ConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => router.push('/organizer/scenarios')}
        title="Выйти из редактора"
        message="Все несохранённые изменения будут потеряны."
        confirmText="Выйти"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}