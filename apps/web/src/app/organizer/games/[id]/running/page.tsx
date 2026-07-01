'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getGame, finishGame, getGameRegistrations,
  sendOrganizerMessage, getOrganizerMessages,
  type GameDetails,
} from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TeamProgress {
  teamId: string;
  teamName: string;
  score: number;
  penalties: number;
  currentNodeId: string | null;
  currentNodeIndex: number;
  status: string;
  startedAt: string | null;
}

interface TeamStatus {
  teamId: string;
  team: { id: string; name: string; slug: string; avatar: string | null };
  status: string;
  readyAt: string | null;
  registeredAt: string;
}

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
  teamId?: string;
}

export default function OrganizerRunningPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameDetails | null>(null);
  const [teams, setTeams] = useState<TeamStatus[]>([]);
  const [progress, setProgress] = useState<TeamProgress[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    try {
      const response = await getGame(gameId);
      setGame(response.data);
      if (response.data.status !== 'RUNNING') {
        router.push(`/organizer/games/${gameId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  }, [gameId, router]);

  const loadTeams = useCallback(async () => {
    try {
      const response = await getGameRegistrations(gameId);
      if (response.data && Array.isArray(response.data)) {
        setTeams(response.data);
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/progress`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  const loadMessages = useCallback(async () => {
    try {
      const response = await getOrganizerMessages(gameId);
      if (response.data && Array.isArray(response.data)) {
        // Преобразуем ответ API в формат ChatMessage
        const formattedMessages: ChatMessage[] = (response.data as any[]).map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          userId: msg.user?.id || msg.userId || '',
          userName: msg.user?.name || msg.userName || 'Неизвестно',
          createdAt: msg.createdAt,
          teamId: msg.teamId || undefined,
        }));
        setMessages(formattedMessages);
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
    loadTeams();
    loadProgress();
    loadMessages();
    setLoading(false);
  }, [loadGame, loadTeams, loadProgress, loadMessages]);

  // Авто-обновление каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      loadProgress();
      loadMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadProgress, loadMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await sendOrganizerMessage(gameId, messageText);
      setMessageText('');
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const handleFinishGame = async () => {
    if (!confirm('Вы уверены, что хотите завершить игру? Все команды будут уведомлены.')) return;
    try {
      await finishGame(gameId);
      router.push(`/organizer/games/${gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка завершения');
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

  if (!game) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">Игра не найдена</p>
            <Link href="/organizer/games" className="btn-primary">← Назад</Link>
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">📊 {game.title}</h1>
            <p className="text-text-secondary text-sm">Управление игрой — идёт активная игра</p>
          </div>
          <button
            onClick={handleFinishGame}
            className="btn-warning"
          >
            ⏹ Завершить игру
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teams Progress */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                🏃 Прогресс команд ({teams.length})
              </h2>

              {progress.length === 0 ? (
                <p className="text-text-secondary text-center py-4">
                  Команды ещё не начали игру
                </p>
              ) : (
                <div className="space-y-4">
                  {progress.map((p) => {
                    const teamInfo = teams.find((t) => t.teamId === p.teamId);
                    const progressPercent = p.currentNodeIndex > 0
                      ? Math.min(100, Math.round((p.currentNodeIndex / 10) * 100))
                      : 0;

                    return (
                      <div key={p.teamId} className="p-4 rounded-lg bg-surface-elevated">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                              {p.teamName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-text-primary font-medium">{p.teamName}</span>
                              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.status === 'active' ? 'bg-success/10 text-success' : 'bg-surface text-text-muted'
                              }`}>
                                {p.status === 'active' ? 'Играет' : p.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{p.score}</div>
                            <div className="text-xs text-text-secondary">очков</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-text-secondary mb-1">
                            <span>Задание {p.currentNodeIndex}</span>
                            <span>Штраф: {p.penalties}</span>
                          </div>
                          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {p.startedAt && (
                          <div className="text-xs text-text-muted">
                            Начали: {new Date(p.startedAt).toLocaleTimeString('ru-RU')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">💬 Чат с командами</h2>

              {/* Messages */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-text-secondary text-center py-4 text-sm">
                    Пока нет сообщений
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg bg-surface-elevated">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {msg.userName}
                          {msg.teamId && (
                            <span className="text-xs text-text-muted ml-2">
                              → {teams.find(t => t.teamId === msg.teamId)?.team.name || 'всем'}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(msg.createdAt).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message */}
              <div className="flex gap-2">
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="input-field w-40 text-sm"
                >
                  <option value="all">📢 Всем командам</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      👥 {t.team.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="input-field flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">ℹ️ Информация</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Статус</span>
                  <span className="text-text-primary font-medium text-warning">🟡 Идёт игра</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Команд</span>
                  <span className="text-text-primary font-medium">{teams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Город</span>
                  <span className="text-text-primary font-medium">{game.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Длительность</span>
                  <span className="text-text-primary font-medium">{game.duration} мин</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">⚡ Быстрые действия</h2>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/organizer/games/${gameId}`}
                  className="btn-secondary text-center"
                >
                  📋 Обзор игры
                </Link>
                <button
                  onClick={handleFinishGame}
                  className="btn-warning text-center"
                >
                  ⏹ Завершить игру
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}