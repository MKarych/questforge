'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient, getMyTeams, setTeamReady, getGameRegistrations, getMyTeamStatus, type GameDetails, type MyTeam } from '@/lib/api/client';
import Header from '@/components/ui/Header';

interface LobbyPageParams {
  [key: string]: string;
  shareLink: string;
}

interface TeamStatus {
  teamId: string;
  team: { id: string; name: string; slug: string; avatar: string | null };
  status: string;
  readyAt: string | null;
  registeredAt: string;
}

interface TimerInfo {
  canStart: boolean;
  timeUntilStart: number;
  status: string;
  startTime: string;
  now: string;
}

export default function PlayLobbyPage() {
  const params = useParams<LobbyPageParams>();
  const router = useRouter();
  const shareLink = params.shareLink;

  const [game, setGame] = useState<GameDetails | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [, setMyTeams] = useState<MyTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<MyTeam | null>(null);
  const [teams, setTeams] = useState<TeamStatus[]>([]);
  const [timer, setTimer] = useState<TimerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [readyLoading, setReadyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      // Получаем игру по shareLink
      const gameResponse = await apiClient.get<any>(`/games/public/share/${shareLink}`);
      const gameData = (gameResponse as any).data;
      setGame(gameData);
      setGameId(gameData.id);

      // Если игра RUNNING — редирект на страницу прохождения
      if (gameData.status === 'RUNNING') {
        try {
          const statusResponse = await getMyTeamStatus(gameData.id);
          if (statusResponse.data?.sessionId) {
            router.replace(`/play/${shareLink}/${statusResponse.data.sessionId}`);
            return;
          }
        } catch {
          // Не удалось получить статус — редиректим на страницу игры
        }
        router.replace(`/play/${shareLink}/${gameData.id}`);
        return;
      }

      // Если игра FINISHED — редирект на финиш
      if (gameData.status === 'FINISHED') {
        try {
          const statusResponse = await getMyTeamStatus(gameData.id);
          if (statusResponse.data?.sessionId) {
            router.replace(`/play/${shareLink}/${statusResponse.data.sessionId}/finish`);
            return;
          }
        } catch {
          // ignore
        }
        router.replace(`/play/${shareLink}/${gameData.id}/finish`);
        return;
      }

      // Получаем команды пользователя
      const teamsResponse = await getMyTeams();
      const userTeams: MyTeam[] = teamsResponse.data && Array.isArray(teamsResponse.data)
        ? teamsResponse.data
        : [];
      setMyTeams(userTeams);

      // Находим команду, которая зарегистрирована на эту игру
      const lastTeamId = localStorage.getItem('currentTeamId');
      if (lastTeamId && userTeams.some((t: MyTeam) => t.id === lastTeamId)) {
        setSelectedTeam(userTeams.find((t: MyTeam) => t.id === lastTeamId) || null);
      }

      // Получаем статусы команд
      const statusResponse = await getGameRegistrations(gameData.id);
      if (statusResponse.data && Array.isArray(statusResponse.data)) {
        setTeams(statusResponse.data);
      }

      // Получаем таймер
      try {
        const timerResponse = await apiClient.get<any>(`/games/${gameData.id}/timer`);
        setTimer((timerResponse as any).data);
      } catch {
        // Таймер может быть недоступен
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [shareLink, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Авто-обновление каждые 5 секунд
  useEffect(() => {
    if (!gameId || game?.status === 'RUNNING' || game?.status === 'FINISHED') return;

    const interval = setInterval(async () => {
      try {
        const [statusResponse, timerResponse] = await Promise.all([
          getGameRegistrations(gameId),
          apiClient.get<any>(`/games/${gameId}/timer`).catch(() => null),
        ]);

        if (statusResponse.data && Array.isArray(statusResponse.data)) {
          setTeams(statusResponse.data);
        }

        if (timerResponse) {
          setTimer((timerResponse as any).data);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, game?.status]);

  const handleReady = async () => {
    if (!gameId || !selectedTeam) return;

    setReadyLoading(true);
    setError(null);

    try {
      await setTeamReady(gameId, selectedTeam.id);
      // Обновляем статусы
      const statusResponse = await getGameRegistrations(gameId);
      if (statusResponse.data && Array.isArray(statusResponse.data)) {
        setTeams(statusResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при подтверждении готовности');
    } finally {
      setReadyLoading(false);
    }
  };

  const isMyTeamReady = (): boolean => {
    if (!selectedTeam) return false;
    return teams.some((t) => t.teamId === selectedTeam.id && t.status === 'READY');
  };

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="card animate-pulse">
              <div className="h-8 bg-surface-elevated rounded mb-4 w-1/2 mx-auto" />
              <div className="h-4 bg-surface-elevated rounded mb-2 w-3/4 mx-auto" />
              <div className="h-4 bg-surface-elevated rounded w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="card border-error text-center py-12">
              <p className="text-error mb-4">{error}</p>
              <Link href="/games" className="btn-primary">
                Вернуться к каталогу
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const readyCount = teams.filter((t) => t.status === 'READY').length;
  const totalCount = teams.length;

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Game Info */}
          <div className="card mb-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🎮</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {game?.title || 'Городской квест'}
              </h1>
              <p className="text-text-secondary">
                {game?.description || ''}
              </p>
              {game && (
                <div className="flex flex-wrap justify-center gap-3 mt-3 text-sm text-text-muted">
                  <span>📍 {game.city}</span>
                  <span>⏱️ {game.duration} мин</span>
                  {game.mode === 'SOLO' ? (
                    <span>👤 Соло-режим · До {game.maxTeams} игроков</span>
                  ) : (
                    <span>👥 До {game.maxTeams} команд</span>
                  )}
                </div>
              )}
            </div>

            {/* Timer */}
            {timer && game?.status === 'LOBBY' && (
              <div className="text-center p-4 rounded-lg bg-surface-elevated mb-4">
                <div className="text-sm text-text-secondary mb-1">
                  {timer.canStart ? 'Игра может начаться!' : 'До старта:'}
                </div>
                <div className={`text-3xl font-bold font-mono ${timer.canStart ? 'text-success' : 'text-text-primary'}`}>
                  {timer.canStart ? '🚀 ГОТОВО!' : formatTime(timer.timeUntilStart)}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Старт: {new Date(timer.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {/* Game Status Badge */}
            <div className="text-center">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                game?.status === 'LOBBY' ? 'bg-warning/10 text-warning' :
                game?.status === 'REGISTRATION_OPEN' ? 'bg-success/10 text-success' :
                game?.status === 'REGISTRATION_CLOSED' ? 'bg-info/10 text-info' :
                'bg-surface-elevated text-text-muted'
              }`}>
                {game?.status === 'LOBBY' ? '🔄 Ожидание старта' :
                 game?.status === 'REGISTRATION_OPEN' ? '📝 Регистрация открыта' :
                 game?.status === 'REGISTRATION_CLOSED' ? '🔒 Регистрация закрыта' :
                 game?.status || ''}
              </span>
            </div>
          </div>

          {/* Solo Mode: Player info */}
          {game?.mode === 'SOLO' ? (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  👤 Моё участие
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Зарегистрирован
                </span>
              </div>
              <div className="p-3 rounded-lg bg-success/10 text-success text-center text-sm">
                ✅ Вы зарегистрированы. Ожидайте начала игры.
              </div>
            </div>
          ) : selectedTeam && (
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  👥 Моя команда: {selectedTeam.name}
                </h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isMyTeamReady() ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isMyTeamReady() ? 'bg-success' : 'bg-warning'}`} />
                  {isMyTeamReady() ? 'Готовы' : 'Не готовы'}
                </span>
              </div>

              {!isMyTeamReady() && game?.status === 'LOBBY' && (
                <button
                  onClick={handleReady}
                  disabled={readyLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {readyLoading ? 'Отправка...' : '✅ Я готов!'}
                </button>
              )}

              {isMyTeamReady() && (
                <div className="p-3 rounded-lg bg-success/10 text-success text-center text-sm">
                  ✅ Ваша команда подтвердила готовность. Ожидайте начала игры.
                </div>
              )}
            </div>
          )}

          {/* Teams / Players List */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {game?.mode === 'SOLO' ? (
                <>📋 Зарегистрированные игроки ({totalCount})</>
              ) : (
                <>📋 Зарегистрированные команды ({totalCount})
                  <span className="text-sm text-text-secondary ml-2">
                    (готовы: {readyCount}/{totalCount})
                  </span>
                </>
              )}
            </h2>

            {teams.length === 0 ? (
              <p className="text-text-secondary text-center py-4">
                {game?.mode === 'SOLO' ? 'Пока нет зарегистрированных игроков' : 'Пока нет зарегистрированных команд'}
              </p>
            ) : (
              <div className="space-y-3">
                {teams.map((t) => (
                  <div
                    key={t.teamId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      !game?.mode || game.mode === 'TEAM' && t.teamId === selectedTeam?.id ? 'bg-primary/5 border border-primary/20' : 'bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        {t.team.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-text-primary font-medium">
                          {t.team.name}
                          {game?.mode !== 'SOLO' && t.teamId === selectedTeam?.id && (
                            <span className="text-xs text-primary ml-2">(это вы)</span>
                          )}
                        </span>
                        <div className="text-xs text-text-muted">
                          {game?.mode === 'SOLO' ? (
                            <>Зарегистрирован: {new Date(t.registeredAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</>
                          ) : (
                            <>Зарегистрированы: {new Date(t.registeredAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </div>
                      </div>
                    </div>
                    {game?.mode !== 'SOLO' && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.status === 'READY' ? 'bg-success/10 text-success' : 'bg-surface text-text-muted'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'READY' ? 'bg-success' : 'bg-text-muted'}`} />
                        {t.status === 'READY' ? 'Готовы' : 'Ожидание'}
                      </span>
                    )}
                    {game?.mode === 'SOLO' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        ✅ Зарегистрирован
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-6">
              {error}
            </div>
          )}

          {/* Back Link */}
          <div className="text-center">
            <Link href="/games" className="text-text-secondary hover:text-text-primary text-sm">
              ← Вернуться к каталогу игр
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}