'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getScenario, updateScenario, publishScenario, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditScenarioPage() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    async function loadScenario() {
      try {
        const response = await getScenario(scenarioId);
        setScenario(response.data);
        setName(response.data.name);
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

  const handleSave = async () => {
    if (!scenario) return;
    setSaving(true);
    setError(null);
    try {
      await updateScenario(scenarioId, { name });
      setScenario(prev => prev ? { ...prev, name } : null);
      router.push('/organizer/scenarios');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить сценарий';
      setError(message);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось опубликовать сценарий';
      setError(message);
    } finally {
      setPublishing(false);
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/organizer/scenarios" className="text-text-secondary hover:text-text-primary text-sm">
            ← Назад к сценариям
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Редактировать сценарий</h1>
            <p className="text-text-secondary mb-6">
              Версия: v{scenario?.version || 1} | Статус: {scenario?.isPublished ? 'Опубликован' : 'Черновик'}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Название сценария</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  {!scenario?.isPublished && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Публикация...' : 'Опубликовать'}
                    </button>
                  )}
                  <Link href="/organizer/scenarios" className="btn-secondary">
                    Отмена
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className="card mt-6">
            <h3 className="font-semibold text-text-primary mb-2">ℹ️ Информация</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Создан: {scenario?.createdAt ? new Date(scenario.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
              <p>Версия: v{scenario?.version || 1}</p>
              <p>Статус: {scenario?.isPublished ? 'Опубликован' : 'Черновик'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
