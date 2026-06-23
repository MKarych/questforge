'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTeam } from '@/lib/api/client';
import Header from '@/components/ui/Header';

function CreateTeamContent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createTeam({ name, description: description || undefined });
      // Save teamId to localStorage for use in lobby
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
              <div>
                <label className="label">Название команды</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Ночные волки"
                  className="input-field"
                  required
                  minLength={2}
                  maxLength={100}
                  autoFocus
                />
              </div>

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

              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
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

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <CreateTeamContent />
    </Suspense>
  );
}
