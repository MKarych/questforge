'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import { useTheme } from '@/hooks/useTheme';
import { apiClient } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке');
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
            <h1 className="text-2xl font-bold text-text-primary mb-2">Восстановление пароля</h1>

            {sent ? (
              <div>
                <p className="text-text-secondary mb-4">
                  Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля.
                </p>
                <p className="text-sm text-text-secondary mb-6">
                  Проверьте вашу почту. Письмо может прийти с задержкой.
                </p>
                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-primary hover:text-primary-hover font-medium"
                  >
                    Вернуться ко входу
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-text-secondary mb-4">
                  Введите email, который вы использовали при регистрации. Мы отправим ссылку для сброса пароля.
                </p>

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
                  {loading ? 'Отправка...' : 'Отправить ссылку'}
                </button>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-primary hover:text-primary-hover"
                  >
                    Вернуться ко входу
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}