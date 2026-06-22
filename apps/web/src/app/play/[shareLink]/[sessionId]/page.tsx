'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSessionState, submitAnswer, type SessionState } from '@/lib/api/client';
import Header from '@/components/ui/Header';

interface PlaySessionPageParams {
  [key: string]: string;
  shareLink: string;
  sessionId: string;
}

export default function PlaySessionPage() {
  const params = useParams<PlaySessionPageParams>();
  const router = useRouter();
  const shareLink = params.shareLink;
  const sessionId = params.sessionId;

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadState() {
      try {
        // In a real implementation, we'd use the teamId from the session
        // For now, we'll use sessionId as a proxy
        const response = await getSessionState(sessionId);
        setSessionState(response.data);
      } catch (err) {
        setMessage({ type: 'error', text: 'Не удалось загрузить состояние игры' });
      } finally {
        setLoading(false);
      }
    }

    loadState();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionState || !answer.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await submitAnswer(
        sessionState.teamId,
        '', // gameId would be needed here
        sessionState.currentNodeId,
        answer.trim(),
      );

      setSessionState({
        ...sessionState,
        score: response.data.score,
        penalties: response.data.penalties,
        currentNodeId: response.data.nextNode?.id || sessionState.currentNodeId,
        history: response.data.history,
      });

      if (response.data.status === 'finished') {
        router.push(`/play/${shareLink}/${sessionId}/finish`);
        return;
      }

      setMessage({
        type: response.data.status === 'success' ? 'success' : 'error',
        text: response.data.message,
      });
      setAnswer('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка отправки ответа' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded mb-4 w-1/2" />
            <div className="h-4 bg-surface rounded mb-2 w-3/4" />
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
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">Сессия не найдена</p>
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
        {/* Game Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Игра в процессе</h1>
            <p className="text-text-secondary">Команда: {sessionState.teamName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary">{sessionState.score}</div>
              <div className="text-xs text-text-secondary">Очки</div>
            </div>
            {sessionState.penalties > 0 && (
              <div className="card text-center">
                <div className="text-2xl font-bold text-error">{sessionState.penalties}</div>
                <div className="text-xs text-text-secondary">Штрафы</div>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`card mb-6 ${message.type === 'success' ? 'border-success' : 'border-error'}`}>
            <p className={message.type === 'success' ? 'text-success' : 'text-error'}>{message.text}</p>
          </div>
        )}

        {/* Task Card */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Задание #{sessionState.currentNodeId}</h2>
          <p className="text-text-secondary mb-6">
            Текст задания будет отображаться здесь. В реальной реализации он загружается из сценария.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ваш ответ</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Введите ответ"
                className="input-field"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Отправка...' : 'Отправить ответ'}
            </button>
          </form>
        </div>

        {/* History */}
        {sessionState.history.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">История</h3>
            <div className="space-y-2">
              {sessionState.history.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.result === 'success' ? 'bg-success/10' : 'bg-error/10'
                  }`}
                >
                  <span className="text-sm text-text-secondary">Задание {entry.nodeId}</span>
                  <span className={`text-sm font-medium ${
                    entry.result === 'success' ? 'text-success' : 'text-error'
                  }`}>
                    {entry.result === 'success' ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
