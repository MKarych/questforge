'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/client';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  team_invite: '👥',
  team_invite_accepted: '✅',
  team_invite_declined: '❌',
  game_start: '🎮',
  game_finish: '🏁',
  game_cancel: '❌',
  game_reschedule: '📅',
  game_registration: '📝',
  comment: '💬',
  review: '⭐',
  organizer_reply: '📝',
  moderation: '🛡️',
  scenario_approved: '✅',
  scenario_rejected: '❌',
  achievement: '🏆',
};

function getIcon(type: string): string {
  return NOTIFICATION_ICONS[type] || '🔔';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications(limit, page * limit);
      setData(res.data as any);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-surface-elevated rounded-xl" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <button onClick={() => window.history.back()} className="text-primary hover:underline text-sm">
            ← Назад
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Уведомления</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-text-muted mt-1">
                {unreadCount} непрочитанных
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
            >
              Прочитать всё
            </button>
          )}
        </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Нет уведомлений
          </h2>
          <p className="text-text-muted">
            Здесь будут появляться уведомления о играх, командах и других событиях
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  !notification.read
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-surface border-border hover:bg-surface-elevated'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-text-muted mt-1">
                          {notification.message}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
                        title="Отметить прочитанным"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-muted">
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="text-xs text-primary hover:text-primary-hover"
                      >
                        Подробнее
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-surface hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Назад
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    page === i
                      ? 'bg-primary text-white'
                      : 'border border-border bg-surface hover:bg-surface-elevated'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-surface hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
      </main>
      <Footer />
    </div>
  );
}