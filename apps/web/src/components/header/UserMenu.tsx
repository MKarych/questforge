'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { logout, type User } from '@/lib/api/client';

interface UserMenuProps {
  user: User | null;
  loading: boolean;
}

export default function UserMenu({ user, loading }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setIsOpen(false);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-elevated animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
          Войти
        </Link>
        <Link href="/auth/register" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
          Регистрация
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-elevated transition-colors"
        aria-label="Меню пользователя"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-primary font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {user.role === 'ADMIN' && 'Админ'}
                {user.role === 'ORGANIZER' && 'Организатор'}
                {user.role === 'MODERATOR' && 'Модератор'}
                {user.role === 'PLAYER' && 'Игрок'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>👤</span>
              Профиль
            </Link>
            <Link
              href="/profile/friends"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>👥</span>
              Мои друзья
            </Link>
            <Link
              href="/profile/following"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>👥</span>
              Подписки
            </Link>
            <Link
              href="/profile/favorites"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>❤️</span>
              Избранное
            </Link>
            <Link
              href="/profile/achievements"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>🏆</span>
              Достижения
            </Link>
            <Link
              href="/profile/activity"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>📋</span>
              Активность
            </Link>
            <Link
              href="/profile/chats"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>💬</span>
              Мои чаты
            </Link>
            <Link
              href="/profile/teams"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>👥</span>
              Мои команды
            </Link>
            <Link
              href="/profile/scenarios"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>📝</span>
              Мои сценарии
            </Link>
            <Link
              href="/organizer/seller"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>🏪</span>
              Кабинет продавца
            </Link>
            <Link
              href="/profile/payouts"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>💰</span>
              Выплаты
            </Link>
            <Link
              href="/profile/analytics"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>📊</span>
              Аналитика
            </Link>
            <Link
              href="/profile/edit"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>⚙️</span>
              Настройки
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>🔔</span>
              Уведомления
            </Link>

            {isAdmin && (
              <>
                <div className="border-t border-border my-1" />
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-warning hover:bg-surface-elevated transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: открыть модалку impersonation
                  }}
                >
                  <span>🔑</span>
                  Impersonation
                </button>
              </>
            )}

            <div className="border-t border-border my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-surface-elevated transition-colors"
            >
              <span>🚪</span>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}