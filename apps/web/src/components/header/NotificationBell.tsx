'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'team_invite' | 'game_start' | 'comment' | 'organizer_reply' | 'moderation' | 'game_cancel';
  title: string;
  description: string;
  href: string;
  isRead: boolean;
  createdAt: string;
}

// Мок-данные (пока без API)
const MOCK_NOTIFICATIONS: Notification[] = [];

interface NotificationBellProps {
  enabled: boolean;
}

export default function NotificationBell({ enabled }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
            <Link
              href="/notifications"
              className="text-xs text-primary hover:text-primary-hover"
              onClick={() => setIsOpen(false)}
            >
              Все уведомления
            </Link>
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
                    href={notification.href}
                    className={`block px-4 py-3 hover:bg-surface-elevated transition-colors ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">
                        {notification.type === 'team_invite' && '👥'}
                        {notification.type === 'game_start' && '🎮'}
                        {notification.type === 'comment' && '💬'}
                        {notification.type === 'organizer_reply' && '📝'}
                        {notification.type === 'moderation' && '🛡️'}
                        {notification.type === 'game_cancel' && '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-text-muted line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                      {!notification.isRead && (
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