'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getGame, updateGame, publishGame, getScenariosForGame, type GameDetails, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    date: '',
    duration: 180,
    price: 0,
    maxTeams: 20,
    scenarioId: '',
  });

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await getGame(gameId);
        const g = response.data;
        setGame(g);
        setFormData({
          title: g.title,
          description: g.description || '',
          city: g.city,
          date: g.date ? g.date.split('T')[0] : '',
          duration: g.duration,
          price: Number(g.price),
          maxTeams: g.maxTeams,
          scenarioId: g.scenario?.id || '',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить игру';
        setError(message);
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    }

    async function loadScenarios() {
      setScenariosLoading(true);
      try {
        const response = await getScenariosForGame();
        setScenarios(response.data.data);
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      } finally {
        setScenariosLoading(false);
      }
    }

    if (gameId) {
      loadGame();
      loadScenarios();
    }
  }, [gameId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' || name === 'maxTeams' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!game) return;
    setSaving(true);
    setError(null);
    try {
      const dateObj = new Date(formData.date);
      const isoDate = dateObj.toISOString();

      await updateGame(gameId, {
        ...formData,
        date: isoDate,
        scenarioId: formData.scenarioId || null,
      });
      
      setGame(prev => prev ? { ...prev, ...formData, date: isoDate } : null);
      router.push(`/organizer/games/${gameId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить игру';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!game) return;
    setPublishing(true);
    setError(null);
    try {
      await publishGame(gameId);
      setGame(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось опубликовать игру';
      setError(message);
    } finally {
      setPublishing(false);
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

  if (error && !game) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Игра не найдена'}</p>
            <Link href="/organizer/games" className="btn-primary">
              ← Назад к играм
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/organizer/games/${gameId}`} className="text-text-secondary hover:text-text-primary text-sm">
            ← Назад к игре
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Редактировать игру</h1>
            <p className="text-text-secondary mb-6">
              Статус: {game?.status}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
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
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Дата и время начала</label>
                  <input
                    type="date"
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

              <div>
                <label className="label">Сценарий (необязательно)</label>
                <select
                  name="scenarioId"
                  value={formData.scenarioId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Без сценария</option>
                  {scenariosLoading ? (
                    <option disabled>Загрузка...</option>
                  ) : (
                    scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name} (v{scenario.version})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Сценарий можно привязать или изменить позже
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  {game?.status !== 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Публикация...' : 'Опубликовать'}
                    </button>
                  )}
                  <Link href={`/organizer/games/${gameId}`} className="btn-secondary">
                    Отмена
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <div className="card mt-6">
            <h3 className="font-semibold text-text-primary mb-2">ℹ️ Информация</h3>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Создана: {game?.createdAt ? new Date(game.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
              <p>Опубликована: {game?.publishedAt ? new Date(game.publishedAt).toLocaleDateString('ru-RU') : 'Не опубликована'}</p>
              <p>Статус: {game?.status}</p>
              {game?.scenario && (
                <p>Сценарий: {game.scenario.name} (v{game.scenario.version})</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
