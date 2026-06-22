'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { startSession } from '@/lib/api/client';
import Header from '@/components/ui/Header';

interface PlayLobbyPageParams {
  shareLink: string;
}

export default function PlayLobbyPage() {
  const params = useParams<PlayLobbyPageParams>();
  const router = useRouter();
  const shareLink = params.shareLink;

  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, we would fetch game info by shareLink
  const gameInfo = {
    title: 'Городской квест',
    description: 'Пройдите увлекательный маршрут по городу',
    shareLink,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we'd get the gameId from the shareLink
      // For demo purposes, we'll use a placeholder
      const response = await startSession({
        gameId: 'placeholder-game-id',
        teamName: teamName.trim(),
      });
      
      router.push(`/play/${shareLink}/${response.data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать игру');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎮</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {gameInfo.title}
              </h1>
              <p className="text-text-secondary">{gameInfo.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Название команды</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Придумайте название"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Ваше имя (необязательно)</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Как к вам обращаться"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Загрузка...' : 'Начать игру'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-text-muted text-center">
                Уже играете?{' '}
                <Link href={`/play/${shareLink}/existing`} className="text-primary hover:text-primary-hover">
                  Продолжить игру
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/games" className="text-text-secondary hover:text-text-primary text-sm">
              ← Вернуться к каталогу игр
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
