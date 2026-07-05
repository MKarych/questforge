'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import AdminNav from '@/components/admin/AdminNav';
import {
  getPendingModeration,
  moderateListing,
  getProfile,
  type PendingModerationListingDto,
} from '@/lib/api/client';

// ==================== Types ====================

type Tab = 'pending' | 'all';

// ==================== Helpers ====================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== Main Page ====================

export default function AdminMarketplacePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [listings, setListings] = useState<PendingModerationListingDto[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reject reason
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const loadListings = useCallback(async () => {
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

      const res = await getPendingModeration();
      setListings(res.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить листинги';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleModerate = async (listingId: string, action: 'approve' | 'reject' | 'block') => {
    const reason = action === 'reject' ? rejectReasons[listingId] : undefined;

    if (action === 'reject' && !reason?.trim()) {
      setNotification({ type: 'error', message: 'Укажите причину отклонения' });
      return;
    }

    try {
      setActionLoading(listingId);
      setNotification(null);

      await moderateListing(listingId, { action, reason });

      const actionLabels: Record<string, string> = {
        approve: 'одобрен',
        reject: 'отклонён',
        block: 'заблокирован',
      };

      setNotification({
        type: 'success',
        message: `Листинг успешно ${actionLabels[action]}`,
      });

      // Remove from list
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при модерации';
      setNotification({ type: 'error', message });
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== Loading State ====================

  if (loading && listings.length === 0) {
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

  if (error && listings.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <button onClick={loadListings} className="btn-primary">
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Render ====================

  const pendingListings = listings.filter((l) => l.status === 'PENDING');
  const allListings = listings;
  const displayedListings = activeTab === 'pending' ? pendingListings : allListings;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Модерация листингов</h1>
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

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
            }`}
          >
            На модерации
            {pendingListings.length > 0 && (
              <span className="ml-2 bg-error text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingListings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
            }`}
          >
            Все
            <span className="ml-2 text-xs text-text-secondary">
              ({allListings.length})
            </span>
          </button>
        </div>

        {/* Listings */}
        {displayedListings.length === 0 ? (
          <EmptyState
            icon="✅"
            title={
              activeTab === 'pending'
                ? 'Нет листингов на модерации'
                : 'Листинги не найдены'
            }
            description={
              activeTab === 'pending'
                ? 'Все листинги уже проверены'
                : 'В системе пока нет листингов'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayedListings.map((listing) => (
              <div key={listing.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {listing.title}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          listing.status === 'PENDING'
                            ? 'bg-warning/10 text-warning'
                            : listing.status === 'PUBLISHED'
                            ? 'bg-success/10 text-success'
                            : listing.status === 'REJECTED'
                            ? 'bg-error/10 text-error'
                            : listing.status === 'BLOCKED'
                            ? 'bg-error/10 text-error'
                            : 'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {listing.status === 'PENDING' ? 'На модерации' :
                         listing.status === 'PUBLISHED' ? 'Опубликован' :
                         listing.status === 'REJECTED' ? 'Отклонён' :
                         listing.status === 'BLOCKED' ? 'Заблокирован' : listing.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-3 flex-wrap">
                      <span className="font-medium text-text-primary">
                        {formatPrice(listing.price)}
                      </span>
                      <span>{listing.category}</span>
                      {listing.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          {listing.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 bg-surface-elevated rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        📜 {listing.scenario.name} v{listing.scenario.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                      <span className="flex items-center gap-1">
                        👤 {listing.author.username}
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 {formatDate(listing.createdAt)}
                      </span>
                      <span className="flex items-center gap-1" title="Просмотры">
                        👁 {listing.views}
                      </span>
                      <span className="flex items-center gap-1" title="Продажи">
                        🛒 {listing.sales}
                      </span>
                    </div>

                    {/* Link to view scenario */}
                    <div className="mt-2">
                      <Link
                        href={`/marketplace/${listing.id}`}
                        className="text-xs text-primary hover:underline"
                        target="_blank"
                      >
                        Просмотреть листинг →
                      </Link>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    {listing.status === 'PENDING' && (
                      <>
                        {/* Approve */}
                        <button
                          onClick={() => handleModerate(listing.id, 'approve')}
                          disabled={actionLoading === listing.id}
                          className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === listing.id ? '...' : '✅ Одобрить'}
                        </button>

                        {/* Reject with reason */}
                        <div className="w-full">
                          <input
                            type="text"
                            placeholder="Причина отклонения"
                            value={rejectReasons[listing.id] || ''}
                            onChange={(e) =>
                              setRejectReasons((prev) => ({
                                ...prev,
                                [listing.id]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 bg-surface-secondary border border-border rounded-lg text-xs mb-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => handleModerate(listing.id, 'reject')}
                            disabled={actionLoading === listing.id || !rejectReasons[listing.id]?.trim()}
                            className="w-full px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === listing.id ? '...' : '❌ Отклонить'}
                          </button>
                        </div>

                        {/* Block */}
                        <button
                          onClick={() => handleModerate(listing.id, 'block')}
                          disabled={actionLoading === listing.id}
                          className="w-full px-4 py-2 bg-surface-elevated text-error border border-error/30 rounded-lg hover:bg-error/5 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === listing.id ? '...' : '🚫 Заблокировать'}
                        </button>
                      </>
                    )}

                    {listing.status !== 'PENDING' && (
                      <span className="text-xs text-text-secondary">
                        {listing.status === 'PUBLISHED' ? 'Уже опубликован' :
                         listing.status === 'REJECTED' ? 'Отклонён' :
                         listing.status === 'BLOCKED' ? 'Заблокирован' : ''}
                      </span>
                    )}
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