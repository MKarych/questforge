'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createGame, getScenariosForGame, type CreateGameRequest, type Scenario } from '@/lib/api/client';
import Header from '@/components/ui/Header';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CreateGamePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCoverChange = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Разрешены только изображения: JPG, PNG, WebP');
      return;
    }

    // Validate file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Максимальный размер файла — 5 MB');
      return;
    }

    setCoverFile(file);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCoverChange(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverChange(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadCover = async (gameId: string, file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/games/${gameId}/upload-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось загрузить обложку');
      }

      const data = await response.json();
      return data.data?.url || null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  useEffect(() => {
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

    loadScenarios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

      // Parse time from datetime-local value (format: "2026-06-24T19:00")
      const time = formData.date.includes('T') ? formData.date.split('T')[1] : '';
      if (!time || typeof time !== 'string') {
        throw new Error('Время должно быть строкой');
      }

      const gameData: CreateGameRequest = {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        date: isoDate,
        time,
        duration: formData.duration,
        price: formData.price,
        maxTeams: formData.maxTeams,
        ...(formData.scenarioId && { scenarioId: formData.scenarioId }),
      };

      const response = await createGame(gameData);
      const gameId = response.data.id;
      
      // Upload cover if file is selected
      if (coverFile) {
        const coverUrl = await uploadCover(gameId, coverFile);
        if (!coverUrl) {
          console.warn('Cover upload failed, but game was created successfully');
        }
      }
      
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
                  Сценарий можно привязать позже в настройках игры
                </p>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="label">Обложка игры</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${coverPreview 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-surface-elevated'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg shadow-lg mb-3"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCover();
                        }}
                        className="mx-auto btn-secondary text-sm py-1 px-3"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-text-primary font-medium mb-1">
                        Перетащите изображение сюда
                      </p>
                      <p className="text-text-secondary text-sm">
                        или нажмите для выбора файла
                      </p>
                      <p className="text-text-muted text-xs mt-2">
                        JPG, PNG, WebP • до 5 MB
                      </p>
                    </div>
                  )}
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
