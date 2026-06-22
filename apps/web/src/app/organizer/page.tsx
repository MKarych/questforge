'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProfile, type User } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OrganizerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    city: '',
    phone: '',
    telegram: '',
    experience: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getProfile();
        setUser(response.data);
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/organizer/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Ошибка при подаче заявки');
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось подать заявку';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isOrganizer = user.role === 'ORGANIZER' || user.role === 'ADMIN';
  const hasPendingApplication = user.organizerStatus === 'PENDING';

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {isOrganizer ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                Вы уже организатор!
              </h1>
              <p className="text-text-secondary mb-8">
                Поздравляем! Вы имеете доступ ко всем функциям панели организатора.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/organizer/dashboard" className="btn-primary">
                  Панель организатора
                </Link>
                <Link href="/organizer/games" className="btn-secondary">
                  Мои игры
                </Link>
              </div>
            </div>
          ) : hasPendingApplication ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">⏳</div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                Заявка на рассмотрении
              </h1>
              <p className="text-text-secondary mb-8">
                Ваша заявка sedang diproses. Мы свяжемся с вами в ближайшее время.
              </p>
              <Link href="/games" className="btn-secondary">
                Смотреть игры
              </Link>
            </div>
          ) : success ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                Заявка подана!
              </h1>
              <p className="text-text-secondary mb-8">
                Спасибо за интерес! Мы рассмотрим вашу заявку и свяжемся с вами.
              </p>
              <Link href="/games" className="btn-secondary">
                Смотреть игры
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🚀</div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Станьте организатором!
                </h1>
                <p className="text-text-secondary">
                  Создавайте свои игры и зарабатывайте на проведении квестов
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="label">Город</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Москва"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+7 (999) 000-00-00"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Telegram (необязательно)</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    placeholder="@username"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Опыт проведения игр (необязательно)</label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Расскажите о вашем опыте..."
                    className="input-field min-h-[100px]"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Отправка...' : 'Подать заявку'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
