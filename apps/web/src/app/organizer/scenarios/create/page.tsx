'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import ScenarioEditor from '@/components/scenario-editor/ScenarioEditor';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function CreateScenarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const hasNavigatedRef = useRef(false);

  // Track changes in the editor
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
    hasNavigatedRef.current = true;
    setSaving(true);
    setToast(null);

    try {
      const token = localStorage.getItem('auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
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
      setToast({ type: 'success', message: '✅ Сценарий создан!' });
      setTimeout(() => {
        router.push(`/organizer/scenarios/${result.id}/edit`);
      }, 1000);
    } catch (err) {
      console.error('Failed to create scenario:', err);
      const message = err instanceof Error ? err.message : 'Не удалось сохранить сценарий';
      setToast({ type: 'error', message: `❌ Ошибка: ${message}` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
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
        <span className="text-xs text-text-secondary">
          {isDirty ? '⚠️ Есть несохранённые изменения' : '✓ Изменений нет'}
        </span>
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
          onSave={handleSave}
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
        title="Выйти из конструктора"
        message="Вы уверены, что хотите выйти? Все несохранённые изменения будут потеряны."
        confirmText="Выйти"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}
