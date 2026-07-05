'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import AdminNav from '@/components/admin/AdminNav';
import { apiClient, getProfile } from '@/lib/api/client';

// ==================== Types ====================

interface PendingScenario {
  id: string;
  name: string;
  description: string | null;
  version: number;
  isPublished: boolean;
  moderationStatus: string | null;
  price: number | null;
  licenseType: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

// ==================== Helpers ====================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'Бесплатно';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

// ==================== Main Page ====================

export default function AdminScenariosPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<PendingScenario[]>([]);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileRes = await getProfile();
      const role = profileRes.data.role;
      setUserRole(role);

      if (role !== 'ADMIN' && role !== 'MODERATOR') {
        router.push('/');
        return;
      }

      const res = await apiClient.get<{ items: PendingScenario[]; total: number }>('/scenarios/admin/pending');
      setScenarios(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить сценарии';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleApprove = async (scenarioId: string) => {
    try {
      setActionLoading(scenarioId);
      setNotification(null);

      await apiClient.post(`/scenarios/admin/${scenarioId}/approve`);

      setNotification({ type: 'success', message: 'Сценарий одобрен и опубликован' });
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при одобрении';
      setNotification({ type: 'error', message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (scenarioId: string) => {
    const reason = rejectReasons[scenarioId];

    if (!reason?.trim()) {
      setNotification({ type: 'error', message: 'Укажите причину отклонения' });
      return;
    }

    try {
      setActionLoading(scenarioId);
      setNotification(null);

      await apiClient.post(`/scenarios/admin/${scenarioId}/reject`, { reason: reason.trim() });

      setNotification({ type: 'success', message: 'Сценарий отклонён' });
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[scenarioId];
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при отклонении';
      setNotification({ type: 'error', message });
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== Loading State ====================

  if (loading && scenarios.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" className="py-12" />
        </div>
      </div>
    );
  }

  // ==================== Error State ====================

  if (error && scenarios.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <button onClick={loadScenarios} className="btn-primary">
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Render ====================

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">📜 Модерация сценариев</h1>
          <span className="text-sm text-text-secondary">
            {userRole === 'ADMIN' ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        {/* Admin Navigation */}
        <AdminNav userRole={userRole} />

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
              notification.type === 'success'
                ? 'bg-success/10 border-success/30'
                : 'bg-error/10 border-error/30'
            }`}
          >
            <span className={notification.type === 'success' ? 'text-success' : 'text-error'}>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <p
              className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-success' : 'text-error'
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className={`ml-auto ${
                notification.type === 'success' ? 'text-success/60 hover:text-success' : 'text-error/60 hover:text-error'
              }`}
            >
              ✕
            </button>
          </div>
        )}

        {/* Scenarios List */}
        {scenarios.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Нет сценариев на модерации"
            description="Все сценарии уже проверены"
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Всего на модерации: <strong className="text-text-primary">{total}</strong>
            </p>
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {scenario.name}
                      </h3>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning">
                        На модерации
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-3 flex-wrap">
                      <span>👤 {scenario.author.name}</span>
                      <span>📧 {scenario.author.email}</span>
                      <span>📅 {formatDate(scenario.publishedAt)}</span>
                      <span>💵 {formatPrice(scenario.price)}</span>
                      {scenario.licenseType && (
                        <span>📄 {scenario.licenseType}</span>
                      )}
                      <span>📋 v{scenario.version}</span>
                    </div>

                    {scenario.description && (
                      <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                        {scenario.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleApprove(scenario.id)}
                    disabled={actionLoading === scenario.id}
                    className="px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === scenario.id ? '...' : '✅ Одобрить'}
                  </button>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Причина отклонения..."
                      value={rejectReasons[scenario.id] || ''}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [scenario.id]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => handleReject(scenario.id)}
                      disabled={actionLoading === scenario.id || !rejectReasons[scenario.id]?.trim()}
                      className="px-4 py-2 bg-error/10 text-error rounded-xl text-sm font-medium hover:bg-error/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === scenario.id ? '...' : '❌ Отклонить'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}