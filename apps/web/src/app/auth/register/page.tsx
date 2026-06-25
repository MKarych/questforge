'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api/client';
import Header from '@/components/ui/Header';

function generateCaptcha(): { a: number; b: number } {
  return {
    a: Math.floor(Math.random() * 10) + 1,
    b: Math.floor(Math.random() * 10) + 1,
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaAnswer('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (!agreeToTerms) {
      setError('Необходимо согласиться с условиями использования');
      return;
    }

    const answer = parseInt(captchaAnswer, 10);
    if (isNaN(answer) || answer !== captcha.a + captcha.b) {
      setError('Неверный ответ капчи');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        name,
        username,
        email,
        password,
        agreeToTerms: true,
        captchaAnswer: answer,
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      refreshCaptcha();
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
              src="/images/logo/logo-horizontal-full.png"
              alt="Adventure Engine"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto"
            />
          </div>
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Регистрация</h1>
            <p className="text-text-secondary mb-6">
              Создайте аккаунт для участия в играх
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Логин</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ваш логин"
                  className="input-field"
                  required
                  minLength={3}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  required
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
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Подтверждение пароля</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              {/* Captcha */}
              <div className="p-4 rounded-lg bg-surface-secondary border border-border">
                <label className="label mb-2">Решите пример:</label>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-text-primary">
                    {captcha.a} + {captcha.b} = ?
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-sm text-primary hover:text-primary-hover"
                    title="Обновить пример"
                  >
                    🔄
                  </button>
                </div>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Ответ"
                  className="input-field"
                  required
                />
              </div>

              {/* Agree to terms checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border bg-surface-primary text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                  Я соглашаюсь с{' '}
                  <Link href="/terms" className="text-primary hover:text-primary-hover">
                    Условиями использования
                  </Link>{' '}
                  и даю согласие на обработку персональных данных согласно{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary-hover">
                    Политике конфиденциальности
                  </Link>.
                </label>
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
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-text-secondary">
                Уже есть аккаунт?{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary-hover font-medium">
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
