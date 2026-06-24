'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getProfile, type User, type SystemStatus } from '@/lib/api/client';
import SystemStatusBar from '@/components/header/SystemStatusBar';
import Breadcrumbs from '@/components/header/Breadcrumbs';
import SearchBar from '@/components/header/SearchBar';
import CommandPalette from '@/components/header/CommandPalette';
import NotificationBell from '@/components/header/NotificationBell';
import ThemeSwitcher from '@/components/header/ThemeSwitcher';
import LanguageSwitcher from '@/components/header/LanguageSwitcher';
import UserMenu from '@/components/header/UserMenu';

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

    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  // Закрываем мобильное меню при смене страницы
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const userRole = user?.role || 'PLAYER';
  const isAuthPage = pathname.startsWith('/auth');

  const isOrganizer = userRole === 'ORGANIZER' || userRole === 'ADMIN';

  // Основная навигация — видна всем
  const mainNavItems = [
    { label: 'Каталог игр', href: '/games', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
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
    { label: 'Админка', href: '/admin', roles: ['ADMIN'] },
  ];

  const visibleMainNav = mainNavItems.filter((item) => item.roles.includes(userRole as any));
  const visibleOrganizerNav = organizerNavItems.filter((item) => item.roles.includes(userRole as any));
  const visibleAdminNav = adminNavItems.filter((item) => item.roles.includes(userRole as any));

  return (
    <>
      <SystemStatusBar status={systemStatus} />

      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <Image
                  src="/images/logo/logo.png"
                  alt="Город Приключений"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
                <span className="text-lg font-bold text-text-primary hidden sm:block">
                  Город Приключений
                </span>
              </Link>
              <Breadcrumbs />
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Основные пункты */}
              {visibleMainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'text-primary bg-primary/10 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Организаторские пункты */}
              {visibleOrganizerNav.length > 0 && (
                <>
                  <span className="mx-1 w-px h-5 bg-border" />
                  {visibleOrganizerNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              {/* Админка */}
              {visibleAdminNav.length > 0 && (
                <>
                  <span className="mx-1 w-px h-5 bg-border" />
                  {visibleAdminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
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

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-elevated"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-4">
              {/* Основные пункты */}
              <div className="flex flex-col gap-1">
                <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Основное
                </p>
                {visibleMainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      pathname.startsWith(item.href)
                        ? 'text-primary bg-primary/10 font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                    }`}
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
                      className={`px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
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
                      className={`px-3 py-2.5 text-sm rounded-lg transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {!user && !loading && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <Link href="/auth/login" className="btn-secondary flex-1 text-center text-sm">
                    Войти
                  </Link>
                  <Link href="/auth/register" className="btn-primary flex-1 text-center text-sm">
                    Регистрация
                  </Link>
                </div>
              )}

              {user && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-primary font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{user.name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/profile/${user.id}`} className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors">
                      👤 Профиль
                    </Link>
                    <Link href="/teams?filter=my" className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors">
                      👥 Мои команды
                    </Link>
                    <Link href="/games?filter=my" className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors">
                      🎮 Мои игры
                    </Link>
                    <Link href="/profile/edit" className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors">
                      ⚙️ Настройки
                    </Link>
                    <Link href="/notifications" className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors">
                      🔔 Уведомления
                    </Link>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Command Palette (глобально) */}
      <CommandPalette user={user} />
    </>
  );
}
