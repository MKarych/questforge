'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getProfile, type User, type SystemStatus } from '@/lib/api/client';
import SystemStatusBar from '@/components/header/SystemStatusBar';
import SearchBar from '@/components/header/SearchBar';
import CommandPalette from '@/components/header/CommandPalette';
import NotificationBell from '@/components/header/NotificationBell';
import ThemeSwitcher from '@/components/header/ThemeSwitcher';
import LanguageSwitcher from '@/components/header/LanguageSwitcher';
import UserMenu from '@/components/header/UserMenu';

const API_BASE = '/api';

interface HeaderProps {
  systemStatus?: SystemStatus | null;
  featureFlags?: {
    search?: boolean;
    notifications?: boolean;
  };
}

export default function Header({ systemStatus = null, featureFlags = { search: true, notifications: true } }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    async function loadProfile() {
      try {
        const response = await getProfile();
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    async function loadUserTier() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const res = await fetch(`${API_BASE}/billing/limits`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          setUserTier(data.tier);
        }
      } catch {
        // ignore
      }
    }

    if (token) {
      loadProfile();
      loadUserTier();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const isFreeTier = userTier === 'FREE' || userTier === null;

  // Закрываем мобильное меню при смене страницы
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Закрытие по клику вне меню
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const userRole = user?.role || 'PLAYER';
  const isAuthPage = pathname.startsWith('/auth');

  // Основная навигация — видна всем
  const mainNavItems = [
    { label: 'Каталог игр', href: '/games', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
    { label: 'Маркетплейс', href: '/marketplace', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
    { label: 'Команды', href: '/teams', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
  ];

  // Организаторская навигация — только ORGANIZER / ADMIN
  const organizerNavItems = [
    { label: 'Мои игры', href: '/organizer/games', roles: ['ORGANIZER', 'ADMIN'] },
    { label: 'Мои сценарии', href: '/organizer/scenarios', roles: ['ORGANIZER', 'ADMIN'] },
    { label: 'Создать игру', href: '/organizer/games/create', roles: ['ORGANIZER', 'ADMIN'] },
    { label: 'Создать сценарий', href: '/organizer/scenarios/create', roles: ['ORGANIZER', 'ADMIN'] },
  ];

  // Админка — только ADMIN
  const adminNavItems = [
    { label: 'Админка', href: '/admin/dashboard', roles: ['ADMIN'] },
  ];

  const visibleMainNav = mainNavItems.filter((item) => item.roles.includes(userRole as any));
  const visibleOrganizerNav = organizerNavItems.filter((item) => item.roles.includes(userRole as any));
  const visibleAdminNav = adminNavItems.filter((item) => item.roles.includes(userRole as any));

  const renderNavLink = (item: { label: string; href: string }, mobile = false) => (
    <Link
      key={item.href}
      href={item.href}
      className={
        mobile
          ? `block px-3 py-2.5 text-sm rounded-lg transition-colors ${
              pathname.startsWith(item.href)
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`
          : `px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname.startsWith(item.href)
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`
      }
    >
      {item.label}
    </Link>
  );

  /** Внутренний компонент для логотипа в шапке: иконка + текст с переключением темы */
  function HeaderLogo() {
    const theme = useTheme();
    const iconSrc = theme === 'dark' ? '/images/logo/logo-icon-dark.svg' : '/images/logo/logo-icon-light.svg';
    const textSrc = theme === 'dark' ? '/images/logo/logo-text-dark.svg' : '/images/logo/logo-text-light.svg';

    return (
      <div className="flex items-center gap-2">
        <Image src={iconSrc} alt="Город Приключений" width={32} height={32} priority />
        <Image src={textSrc} alt="Город Приключений" width={120} height={24} priority />
      </div>
    );
  }

  return (
    <>
      <SystemStatusBar status={systemStatus} />

      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Name — иконка + текст */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <HeaderLogo />
              </Link>
            </div>

            {/* Center: Desktop Navigation (lg+) — только на десктопе */}
            <nav className="hidden lg:flex items-center gap-1">
              {visibleMainNav.map((item) => renderNavLink(item))}

              {/* Организаторские пункты — только на десктопе (lg+) */}
              {visibleOrganizerNav.length > 0 && (
                <>
                  <span className="mx-1 w-px h-5 bg-border" />
                  {visibleOrganizerNav.map((item) => renderNavLink(item))}
                </>
              )}

              {/* Админка — только на десктопе (lg+) */}
              {visibleAdminNav.length > 0 && (
                <>
                  <span className="mx-1 w-px h-5 bg-border" />
                  {visibleAdminNav.map((item) => renderNavLink(item))}
                </>
              )}
            </nav>

            {/* Right: Actions — показываем на md+ (планшеты и десктоп) */}
            <div className="hidden md:flex items-center gap-1">
              {/* PRO Button — только для авторизованных */}
              {user && (
                <Link
                  href="/upgrade"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 mr-1 ${
                    isFreeTier
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm hover:shadow-md hover:from-amber-600 hover:to-yellow-600 animate-pulse-slow'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  }`}
                >
                  <span>💎</span>
                  <span className="hidden sm:inline">PRO</span>
                </Link>
              )}
              {/* Search */}
              {featureFlags.search && (
                <>
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
                    aria-label="Поиск"
                    title="Поиск (Ctrl+K)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  <div className="relative">
                    <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
                  </div>
                </>
              )}

              {/* Notifications */}
              {featureFlags.notifications && user && (
                <NotificationBell enabled={true} />
              )}

              {/* Theme */}
              <ThemeSwitcher />

              {/* Language */}
              <LanguageSwitcher />

              {/* User Menu */}
              {!isAuthPage && (
                <UserMenu user={user} loading={loading} />
              )}
            </div>

            {/* Mobile/Tablet: гамбургер (на < lg) — показываем на телефонах и планшетах */}
            <div className="flex lg:hidden items-center gap-1">
              {/* User Menu на мобилке — аватарка с выпадающим меню */}
              {!isAuthPage && (
                <UserMenu user={user} loading={loading} />
              )}

              {/* Кнопка PRO на мобилке — только иконка */}
              {user && (
                <Link
                  href="/upgrade"
                  className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                  aria-label="PRO"
                >
                  <span className="text-lg">💎</span>
                </Link>
              )}

              <button
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu — вынесен за пределы header чтобы избежать проблем с z-index и sticky */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Затемнение */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Панель меню */}
          <div
            ref={menuRef}
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <span className="text-lg font-bold text-primary">
                Город Приключений
              </span>
              <button
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

              <nav className="px-4 py-4">
                {/* Профиль / Вход */}
                {!user && !loading && (
                  <div className="flex gap-3 mb-6 pb-6 border-b border-border">
                    <Link
                      href="/auth/login"
                      className="btn-secondary flex-1 text-center text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Войти
                    </Link>
                    <Link
                      href="/auth/register"
                      className="btn-primary flex-1 text-center text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Регистрация
                    </Link>
                  </div>
                )}

                {user && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-primary font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/profile/${user.id}`}
                        className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        👤 Профиль
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        ⚙️ Настройки
                      </Link>
                    </div>
                  </div>
                )}

                {/* Основные пункты */}
                <div className="flex flex-col gap-1">
                  <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Основное
                  </p>
                  {visibleMainNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Организаторские пункты */}
                {visibleOrganizerNav.length > 0 && (
                  <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-border">
                    <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Организатору
                    </p>
                    {visibleOrganizerNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                          pathname.startsWith(item.href)
                            ? 'text-primary bg-primary/10 font-medium'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Админка */}
                {visibleAdminNav.length > 0 && (
                  <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-border">
                    <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Администрирование
                    </p>
                    {visibleAdminNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                          pathname.startsWith(item.href)
                            ? 'text-primary bg-primary/10 font-medium'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Дополнительные ссылки для авторизованных */}
                {user && (
                  <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-border">
                    <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Ещё
                    </p>
                    <Link
                      href="/teams?filter=my"
                      className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      👥 Мои команды
                    </Link>
                    <Link
                      href="/games?filter=my"
                      className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🎮 Мои игры
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🔔 Уведомления
                    </Link>
                  </div>
                )}

                {/* Переключатели внизу */}
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                  {featureFlags.search && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setSearchOpen(true);
                      }}
                      className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
                      aria-label="Поиск"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

      {/* Command Palette (глобально) */}
      <CommandPalette user={user} />
    </>
  );
}
