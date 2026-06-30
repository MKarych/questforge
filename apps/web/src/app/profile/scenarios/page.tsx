'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getUserScenarios } from '@/lib/api/client';

interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  ARCHIVED: 'В архиве',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-yellow-400 bg-yellow-500/10',
  PUBLISHED: 'text-green-400 bg-green-500/10',
  ARCHIVED: 'text-text-secondary bg-surface-secondary',
};

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadScenarios = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserScenarios('me', limit, pageNum * limit);
      const data = res.data?.items || [];
      if (pageNum === 0) {
        setScenarios(data);
      } else {
        setScenarios((prev) => [...prev, ...data]);
      }
      setTotal(res.data?.total || data.length);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки сценариев');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenarios(0);
  }, [loadScenarios]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadScenarios(nextPage);
  };

  const hasMore = scenarios.length < total;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/profile" className="hover:text-primary">Профиль</Link>
          <span>/</span>
          <span className="text-text-primary">Мои сценарии</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Мои сценарии</h1>
          <Link
            href="/scenarios/create"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            Создать сценарий
          </Link>
        </div>

        {loading && scenarios.length === 0 ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={() => loadScenarios(0)} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : scenarios.length === 0 ? (
          <EmptyState
            icon="📝"
            title="У вас пока нет сценариев"
            description="Создайте свой первый сценарий"
            ctaText="Создать сценарий"
            ctaLink="/scenarios/create"
          />
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-3">
              {scenarios.map((scenario) => (
                <Link
                  key={scenario.id}
                  href={`/scenarios/${scenario.id}`}
                  className="card card-hover p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[scenario.status] || 'text-text-secondary bg-surface-secondary'}`}>
                          {STATUS_LABELS[scenario.status] || scenario.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-text-primary truncate">{scenario.title}</p>
                      {scenario.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{scenario.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-text-secondary/60">
                          Создан: {new Date(scenario.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="text-[10px] text-text-secondary/60">
                          Обновлён: {new Date(scenario.updatedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-text-secondary shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}