'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createGame, type CreateGameRequest } from '@/lib/api/client';
import Header from '@/components/ui/Header';

export default function CreateGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    date: '',
    duration: 180,
    price: 0,
    maxTeams: 20,
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' || name === 'maxTeams' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Format date to ISO string
      const dateObj = new Date(formData.date);
      const isoDate = dateObj.toISOString();

      const gameData: CreateGameRequest = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        date: isoDate,
        duration: formData.duration,
        price: formData.price,
        maxTeams: formData.maxTeams,
      };

      const response = await createGame(gameData);
      
      // Redirect to game management page
      router.push(`/organizer/games/${response.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать игру';
      setError(message);
      console.error('Failed to create game:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary text-sm">
              ← Назад к панели
            </Link>
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Создать игру</h1>
            <p className="text-text-secondary mb-6">
              Заполните информацию о новой игре
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Название игры</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Тайны старого города"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Опишите, что ждёт участников..."
                  className="input-field min-h-[120px]"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Город</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Минск"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Дата и время начала</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Длительность (мин)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min={30}
                    max={480}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Цена (₽)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min={0}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Макс. команд</label>
                  <input
                    type="number"
                    name="maxTeams"
                    value={formData.maxTeams}
                    onChange={handleChange}
                    min={1}
                    max={100}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Создание...' : 'Создать игру'}
                  </button>
                  <Link href="/organizer/dashboard" className="btn-secondary">
                    Отмена
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className="card mt-6 bg-primary/10 border-primary">
            <h3 className="font-semibold text-text-primary mb-2">💡 Совет</h3>
            <p className="text-sm text-text-secondary">
              После создания игры вам нужно будет добавить сценарий с заданиями.
              Используйте конструктор сценариев для создания увлекательного маршрута.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
