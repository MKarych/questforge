'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getScenarios, publishScenario, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const response = await getScenarios();
        setScenarios(response.data.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарии';
        setError(message);
        // If unauthorized, redirect to login
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
  }, [router]);

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      await publishScenario(id);
      setScenarios(prev => prev.map(s => s.id === id ? { ...s, isPublished: true } : s));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось опубликовать сценарий';
      setError(message);
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="py-12" />
        </div>
      </div>
    );
  }

  if (error && !scenarios.length) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <Link href="/auth/login" className="btn-primary">
              Войти
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Мои сценарии</h1>
            <p className="text-text-secondary">
              Управление сценариями для игр
            </p>
          </div>
          <Link href="/organizer/scenarios/create" className="btn-primary">
            + Создать сценарий
          </Link>
        </div>

        {scenarios.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Сценариев пока нет
            </h3>
            <p className="text-text-secondary mb-6">
              Создайте свой первый сценарий для проведения игр
            </p>
            <Link href="/organizer/scenarios/create" className="btn-primary">
              Создать сценарий
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {scenario.name}
                  </h3>
                  {scenario.isPublished ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-success/10 text-success">
                      Опубликован
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-surface-elevated text-text-muted">
                      Черновик
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-text-secondary mb-4">
                  <div className="flex items-center justify-between">
                    <span>Версия:</span>
                    <span className="text-text-primary">v{scenario.version}</span>
                  </div>
                  {scenario.salesCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Продаж:</span>
                      <span className="text-text-primary">{scenario.salesCount}</span>
                    </div>
                  )}
                  {scenario.rating !== undefined && scenario.rating > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Рейтинг:</span>
                      <span className="text-warning">★ {scenario.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Создан:</span>
                    <span className="text-text-primary">
                      {new Date(scenario.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/organizer/scenarios/${scenario.id}`}
                    className="btn-secondary text-sm flex-1 text-center"
                  >
                    Редактировать
                  </Link>
                  {!scenario.isPublished && (
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handlePublish(scenario.id)}
                      disabled={publishingId === scenario.id}
                    >
                      {publishingId === scenario.id ? 'Публикация...' : 'Опубликовать'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
