'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getProfile, logout, type User } from '@/lib/api/client';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Синхронизация: если токен есть, но user отсутствует — загружаем профиль
    if (token && !user) {
      loadProfile();
    }
    
    // Загружаем профиль на страницах авторизации и в дашборде
    if (pathname.startsWith('/auth') || pathname.startsWith('/organizer') || pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const isAuthPage = pathname.startsWith('/auth');

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo/logo.png"
              alt="Adventure Engine"
              width={40}
              height={40}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-white hidden sm:block">
              Город Приключений
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/games" className="text-text-secondary hover:text-text-primary transition-colors">
              Игры
            </Link>
            {user && (
              <Link href="/teams" className="text-text-secondary hover:text-text-primary transition-colors">
                Команды
              </Link>
            )}
            <Link href="/organizer" className="text-text-secondary hover:text-text-primary transition-colors">
              Организаторам
            </Link>
            {!loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <Link href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                    Панель
                  </Link>
                  <Link href="/organizer/games" className="text-text-secondary hover:text-text-primary transition-colors">
                    Игры
                  </Link>
                  <Link href="/organizer/scenarios" className="text-text-secondary hover:text-text-primary transition-colors">
                    Сценарии
                  </Link>
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-primary font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary">
                    Выйти
                  </button>
                </div>
              ) : !isAuthPage && (
                <>
                  <Link href="/auth/login" className="btn-secondary">
                    Войти
                  </Link>
                  <Link href="/auth/register" className="btn-primary">
                    Регистрация
                  </Link>
                </>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
            <Link href="/games" className="text-text-secondary hover:text-text-primary transition-colors">
              Игры
            </Link>
            {user && (
              <Link href="/teams" className="text-text-secondary hover:text-text-primary transition-colors">
                Команды
              </Link>
            )}
            <Link href="/organizer" className="text-text-secondary hover:text-text-primary transition-colors">
              Организаторам
            </Link>
              {!loading && (
                user ? (
                  <div className="flex flex-col gap-3 pt-2">
                    <Link href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                      Панель
                    </Link>
                    <Link href="/organizer/games" className="text-text-secondary hover:text-text-primary transition-colors">
                      Игры
                    </Link>
                    <Link href="/organizer/scenarios" className="text-text-secondary hover:text-text-primary transition-colors">
                      Сценарии
                    </Link>
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-primary font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-text-secondary text-sm">{user.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="btn-secondary">
                      Выйти
                    </button>
                  </div>
                ) : !isAuthPage && (
                  <div className="flex gap-3 pt-2">
                    <Link href="/auth/login" className="btn-secondary flex-1 text-center">
                      Войти
                    </Link>
                    <Link href="/auth/register" className="btn-primary flex-1 text-center">
                      Регистрация
                    </Link>
                  </div>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
