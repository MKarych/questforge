'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionState, type SessionState } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import ProgressBar from '@/components/game/ProgressBar';

interface PlayFinishPageParams {
  [key: string]: string;
  shareLink: string;
  sessionId: string;
}

export default function PlayFinishPage() {
  const params = useParams<PlayFinishPageParams>();
  const sessionId = params.sessionId;
  const shareLink = params.shareLink;

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const totalTime = sessionState?.finishedAt
    ? Math.floor((new Date(sessionState.finishedAt).getTime() - new Date(sessionState.startedAt).getTime()) / 1000)
    : 0;

  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} мин ${secs} сек`;
  };

  const correctAnswers = sessionState?.history.filter(h => h.result === 'success').length || 0;
  const wrongAnswers = sessionState?.history.filter(h => h.result === 'fail').length || 0;
  const timeouts = sessionState?.history.filter(h => h.result === 'timeout').length || 0;
  const totalTasks = sessionState?.history.length || 0;

  const handleShare = async () => {
    const shareText = `🏆 Я прошёл игру "${shareLink}"!\n\n` +
      `Счёт: ${sessionState?.score}\n` +
      `Время: ${formatTotalTime(totalTime)}\n` +
      `Правильных ответов: ${correctAnswers}/${totalTasks}\n\n` +
      `#AdventureEngine #QuestGame`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-12">
            {/* Trophy Animation */}
            <div className="text-7xl mb-6 animate-bounce">🏆</div>
            
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              Игра завершена!
            </h1>
            <p className="text-text-secondary mb-8 text-lg">
              {sessionState.teamName === 'Соло' ? 'Вы успешно прошли игру' : `Команда «${sessionState.teamName}» успешно прошла игру`}
            </p>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card bg-primary/10 border-primary">
                <div className="text-4xl font-bold text-primary mb-1">
                  {sessionState.score}
                </div>
                <div className="text-sm text-text-secondary">Итоговый счёт</div>
              </div>
              
              <div className="card bg-warning/10 border-warning">
                <div className="text-4xl font-bold text-warning mb-1">
                  {sessionState.penalties}
                </div>
                <div className="text-sm text-text-secondary">Штрафы</div>
              </div>
              
              <div className="card bg-success/10 border-success">
                <div className="text-4xl font-bold text-success mb-1">
                  {correctAnswers}
                </div>
                <div className="text-sm text-text-secondary">Верно</div>
              </div>
              
              <div className="card bg-info/10 border-info">
                <div className="text-4xl font-bold text-info mb-1">
                  {formatTotalTime(totalTime)}
                </div>
                <div className="text-sm text-text-secondary">Время</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <ProgressBar
                current={correctAnswers}
                total={totalTasks}
                difficulty={
                  correctAnswers / totalTasks > 0.7 ? 'easy' :
                  correctAnswers / totalTasks > 0.4 ? 'medium' : 'hard'
                }
              />
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
              <div className="card">
                <div className="text-2xl font-bold text-success">{correctAnswers}</div>
                <div className="text-xs text-text-secondary">Правильных</div>
              </div>
              <div className="card">
                <div className="text-2xl font-bold text-error">{wrongAnswers}</div>
                <div className="text-xs text-text-secondary">Ошибок</div>
              </div>
              <div className="card">
                <div className="text-2xl font-bold text-warning">{timeouts}</div>
                <div className="text-xs text-text-secondary">Таймаутов</div>
              </div>
            </div>

            {/* History */}
            {sessionState.history.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-text-primary">
                  📊 Результаты по заданиям
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionState.history.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.result === 'success' ? 'bg-success/10' :
                        entry.result === 'timeout' ? 'bg-warning/10' : 'bg-error/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-primary">
                          Задание {entry.nodeId}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.result === 'success' ? 'bg-success text-white' :
                          entry.result === 'timeout' ? 'bg-warning text-white' : 'bg-error text-white'
                        }`}>
                          {entry.result === 'success' ? 'Успех' :
                           entry.result === 'timeout' ? 'Таймаут' : 'Ошибка'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.score !== undefined && entry.score !== 0 && (
                          <span className={`text-sm font-bold ${
                            entry.score > 0 ? 'text-success' : 'text-error'
                          }`}>
                            {entry.score > 0 ? '+' : ''}{entry.score}
                          </span>
                        )}
                        <span className={`text-xl font-bold ${
                          entry.result === 'success' ? 'text-success' :
                          entry.result === 'timeout' ? 'text-warning' : 'text-error'
                        }`}>
                          {entry.result === 'success' ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="btn-secondary mb-4 flex items-center gap-2 mx-auto"
            >
              <span>📤</span>
              <span>{copied ? 'Скопировано!' : 'Поделиться результатом'}</span>
            </button>

            {/* Actions */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href={`/play/${shareLink}`} className="btn-secondary">
                🔄 Играть снова
              </Link>
              <Link href={`/games/${shareLink}`} className="btn-secondary">
                ⭐ Оставить отзыв
              </Link>
              <Link href="/games" className="btn-primary">
                🎮 Другие игры
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
