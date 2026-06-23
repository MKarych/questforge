'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTeam } from '@/lib/api/client';
import Header from '@/components/ui/Header';

function CreateTeamContent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [joinPolicy, setJoinPolicy] = useState('OPEN');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await createTeam({
        name,
        slug: slug || undefined,
        description: description || undefined,
        city: city || undefined,
        country: country || undefined,
        website: website || undefined,
        privacy,
        joinPolicy,
        tags: tags.length > 0 ? tags : undefined,
      });
      localStorage.setItem('currentTeamId', response.data.id);
      router.push(`/teams/${response.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания команды';
      setError(message);
      console.error('Create team error:', err);
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
            <Link href="/teams" className="text-text-secondary hover:text-text-primary text-sm">
              ← Назад к командам
            </Link>
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Создать команду
            </h1>
            <p className="text-text-secondary mb-6">
              Создайте команду для участия в городских квестах
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Название */}
              <div>
                <label className="label">Название команды *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Например: Ночные волки"
                  className="input-field"
                  required
                  minLength={2}
                  maxLength={100}
                  autoFocus
                />
              </div>

              {/* Slug (URL) */}
              <div>
                <label className="label">URL-идентификатор</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="nochnye-volki"
                  className="input-field font-mono text-sm"
                  maxLength={100}
                />
                <p className="text-xs text-text-secondary mt-1">
                  Будет использоваться в URL команды. Генерируется автоматически из названия.
                </p>
              </div>

              {/* Описание */}
              <div>
                <label className="label">Описание (необязательно)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите о вашей команде..."
                  className="input-field"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Город и Страна */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Город</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Москва"
                    className="input-field"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="label">Страна</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Россия"
                    className="input-field"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Сайт */}
              <div>
                <label className="label">Веб-сайт (необязательно)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="input-field"
                />
              </div>

              {/* Настройки приватности */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Видимость</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="input-field"
                  >
                    <option value="PUBLIC">Публичная</option>
                    <option value="PRIVATE">Приватная</option>
                    <option value="UNLISTED">Скрытая</option>
                  </select>
                </div>
                <div>
                  <label className="label">Способ вступления</label>
                  <select
                    value={joinPolicy}
                    onChange={(e) => setJoinPolicy(e.target.value)}
                    className="input-field"
                  >
                    <option value="OPEN">Свободный</option>
                    <option value="INVITE_ONLY">По приглашению</option>
                    <option value="REQUEST">По заявке</option>
                    <option value="CLOSED">Закрытая</option>
                  </select>
                </div>
              </div>

              {/* Теги */}
              <div>
                <label className="label">Теги (через запятую)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="квесты, москва, любители"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Создание...' : 'Создать команду'}
                </button>
                <Link href="/teams" className="btn-secondary">
                  Отмена
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CreateTeamContent />
    </Suspense>
  );
}
