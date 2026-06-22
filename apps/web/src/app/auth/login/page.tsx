'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api/client';
import Header from '@/components/ui/Header';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email, password });
      router.push('/organizer/dashboard');
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
            <h1 className="text-2xl font-bold text-white mb-2">Город Приключений</h1>
            <Image
              src="/images/logo/logo.png"
              alt="Adventure Engine"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto"
            />
          </div>
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Вход</h1>
            <p className="text-text-secondary mb-6">
              Войдите в свой аккаунт для продолжения
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
