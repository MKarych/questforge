'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionState, type SessionState } from '@/lib/api/client';
import Header from '@/components/ui/Header';

interface PlayFinishPageParams {
  shareLink: string;
  sessionId: string;
}

export default function PlayFinishPage() {
  const params = useParams<PlayFinishPageParams>();
  const sessionId = params.sessionId;
  const shareLink = params.shareLink;

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      try {
        const response = await getSessionState(sessionId);
        setSessionState(response.data);
      } finally {
        setLoading(false);
      }
    }

    loadState();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded mb-4 w-1/2 mx-auto" />
            <div className="h-64 bg-surface rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!sessionState) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">Игра не найдена</p>
            <Link href="/games" className="btn-primary">
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalTime = sessionState.finishedAt
    ? Math.floor((new Date(sessionState.finishedAt).getTime() - sessionState.startedAt) / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-12">
            <div className="text-6xl mb-6">🏆</div>
            
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Игра завершена!
            </h1>
            <p className="text-text-secondary mb-8">
              Команда «{sessionState.teamName}» прошла игру
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card">
                <div className="text-3xl font-bold text-primary mb-1">
                  {sessionState.score}
                </div>
                <div className="text-sm text-text-secondary">Очков</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-warning mb-1">
                  {sessionState.penalties}
                </div>
                <div className="text-sm text-text-secondary">Штрафов</div>
              </div>
              <div className="card">
                <div className="text-3xl font-bold text-success mb-1">
                  {totalTime}
                </div>
                <div className="text-sm text-text-secondary">Минут</div>
              </div>
            </div>

            {/* History */}
            {sessionState.history.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">Результаты по заданиям</h2>
                <div className="space-y-2">
                  {sessionState.history.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.result === 'success' ? 'bg-success/10' : 'bg-error/10'
                      }`}
                    >
                      <span className="text-sm text-text-secondary">Задание {entry.nodeId}</span>
                      <div className="flex items-center gap-2">
                        {entry.score && (
                          <span className="text-sm font-medium text-primary">+{entry.score}</span>
                        )}
                        <span className={`text-lg font-bold ${
                          entry.result === 'success' ? 'text-success' : 'text-error'
                        }`}>
                          {entry.result === 'success' ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Link href={`/play/${shareLink}`} className="btn-secondary">
                Играть снова
              </Link>
              <Link href="/games" className="btn-primary">
                Другие игры
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
