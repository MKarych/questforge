'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import { useTheme } from '@/hooks/useTheme';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await login({ login: loginField, password });
      // Если есть предупреждение (например, неподтверждённый email) — показываем
      if ((response.data as any).warning) {
        setWarning((response.data as any).warning);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <Image
              src={theme === 'dark' ? '/images/logo/logo-full-dark.svg' : '/images/logo/logo-full-light.svg'}
              alt="Adventure Engine"
              width={120}
              height={40}
              className="mx-auto"
            />
          </div>
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Вход</h1>
            <p className="text-text-secondary mb-6">
              Войдите в свой аккаунт для продолжения
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Логин или Email</label>
                <input
                  type="text"
                  value={loginField}
                  onChange={(e) => setLoginField(e.target.value)}
                  placeholder="Ваш логин или email"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {warning && (
                <div className="p-3 rounded-lg bg-warning/10 text-warning text-sm">
                  {warning}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>

              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Забыли пароль?
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-text-secondary">
                Нет аккаунта?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary-hover font-medium">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
