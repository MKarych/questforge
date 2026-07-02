'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getScenarios, publishScenario, deleteScenario, getListingByScenarioId, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [listingsMap, setListingsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadScenarios() {
      try {
        // No published filter — show ALL user scenarios (drafts + published)
        const response = await getScenarios();
        const scenariosData = response.data.data;
        setScenarios(scenariosData);

        // Загружаем информацию о листингах для опубликованных сценариев
        const publishedScenarios = scenariosData.filter(s => s.isPublished);
        if (publishedScenarios.length > 0) {
          const listingsMap: Record<string, boolean> = {};
          await Promise.all(
            publishedScenarios.map(async (s) => {
              try {
                const listingRes = await getListingByScenarioId(s.id);
                listingsMap[s.id] = listingRes.data !== null;
              } catch {
                listingsMap[s.id] = false;
              }
            }),
          );
          setListingsMap(listingsMap);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарии';
        setError(message);
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

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);
    setShowDeleteModal(false);
    try {
      await deleteScenario(deleteTargetId);
      setScenarios(prev => prev.filter(s => s.id !== deleteTargetId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить сценарий';
      setError(message);
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
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
                  <div className="flex items-center gap-2">
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
                    href={`/organizer/scenarios/${scenario.id}/edit`}
                    className="btn-secondary text-sm flex-1 text-center"
                  >
                    Редактировать
                  </Link>
                  {scenario.isPublished ? (
                    listingsMap[scenario.id] === true ? (
                      <Link
                        href="/organizer/listings"
                        className="btn-outline text-sm flex-1 text-center"
                      >
                        Перейти к листингу
                      </Link>
                    ) : (
                      <Link
                        href={`/marketplace/create?scenarioId=${scenario.id}`}
                        className="btn-primary text-sm flex-1 text-center"
                      >
                        Выставить на продажу
                      </Link>
                    )
                  ) : (
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handlePublish(scenario.id)}
                      disabled={publishingId === scenario.id}
                    >
                      {publishingId === scenario.id ? 'Публикация...' : 'Опубликовать'}
                    </button>
                  )}
                  <button
                    className="btn-outline text-sm px-3 text-error hover:text-error"
                    onClick={() => handleDeleteClick(scenario.id)}
                    disabled={deletingId === scenario.id}
                    title="Удалить сценарий"
                  >
                    {deletingId === scenario.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Удалить сценарий"
        message="Вы уверены, что хотите удалить этот сценарий? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}
