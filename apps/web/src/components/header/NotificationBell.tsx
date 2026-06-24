'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface RecentResponse {
  items: NotificationItem[];
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes}м назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}д назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

interface NotificationBellProps {
  enabled: boolean;
}

export default function NotificationBell({ enabled }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<RecentResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch('/api/notifications/recent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [enabled, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  if (!enabled) return null;

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.items ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
        aria-label={`Уведомления${unreadCount > 0 ? `, ${unreadCount} новых` : ''}`}
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-error rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Уведомления</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Прочитать всё
                </button>
              )}
              <Link
                href="/notifications"
                className="text-xs text-primary hover:text-primary-hover"
                onClick={() => setIsOpen(false)}
              >
                Все уведомления
              </Link>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-2xl mb-2">🔔</div>
              <p className="text-sm text-text-muted">Нет новых уведомлений</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.link || '/notifications'}
                    className={`block px-4 py-3 hover:bg-surface-elevated transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-text-muted line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}