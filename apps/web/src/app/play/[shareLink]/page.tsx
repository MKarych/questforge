'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicGame, getMyTeams, registerTeam, type GameDetails, type MyTeam } from '@/lib/api/client';
import Header from '@/components/ui/Header';

interface PlayLobbyPageParams {
  [key: string]: string;
  shareLink: string;
}

export default function PlayLobbyPage() {
  const params = useParams<PlayLobbyPageParams>();
  const shareLink = params.shareLink;

  const [game, setGame] = useState<GameDetails | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch game by shareLink
        const gameResponse = await getPublicGame(shareLink);
        setGame(gameResponse.data);

        // Fetch user's teams (if logged in)
        try {
          const teamsResponse = await getMyTeams();
          if (teamsResponse.data && Array.isArray(teamsResponse.data)) {
            setMyTeams(teamsResponse.data);
            // Pre-select last used team from localStorage
            const lastTeamId = localStorage.getItem('currentTeamId');
            if (lastTeamId && teamsResponse.data.some((t: MyTeam) => t.id === lastTeamId)) {
              setSelectedTeamId(lastTeamId);
            }
          }
        } catch {
          // User not logged in — that's ok
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить игру');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [shareLink]);

  const handleRegister = async () => {
    if (!selectedTeamId || !game) return;

    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerTeam(game.id, selectedTeamId);
      setSuccess(`Команда "${response.data.team.name}" зарегистрирована на игру!`);
      localStorage.setItem('currentTeamId', selectedTeamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации на игру');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
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
          <div className="max-w-md mx-auto">
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎮</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {game?.title || 'Городской квест'}
              </h1>
              <p className="text-text-secondary">
                {game?.description || 'Пройдите увлекательный маршрут по городу'}
              </p>
              {game && (
                <div className="flex flex-wrap justify-center gap-3 mt-4 text-sm text-text-muted">
                  <span>📍 {game.city}</span>
                  <span>⏱️ {game.duration} мин</span>
                  <span>👥 До {game.maxTeams} команд</span>
                </div>
              )}
            </div>

            {success ? (
              <div className="text-center">
                <div className="p-4 rounded-lg bg-success/10 text-success mb-4">
                  {success}
                </div>
                <p className="text-text-secondary text-sm mb-4">
                  Ожидайте начала игры. Организатор запустит игру, когда все команды будут готовы.
                </p>
                <Link
                  href={`/play/${shareLink}/lobby`}
                  className="btn-primary w-full"
                >
                  Перейти в лобби
                </Link>
              </div>
            ) : (
              <>
                {myTeams.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Выберите команду</label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="input-field"
                      >
                        <option value="">-- Выберите команду --</option>
                        {myTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} {team.myRole === 'captain' ? '👑' : ''} ({team.membersCount} уч.)
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleRegister}
                      disabled={registering || !selectedTeamId}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? 'Регистрация...' : 'Зарегистрироваться на игру'}
                    </button>

                    <div className="text-center">
                      <Link
                        href="/teams/create"
                        className="text-primary hover:text-primary-hover text-sm"
                      >
                        + Создать новую команду
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-text-secondary">
                      У вас пока нет команд. Создайте команду, чтобы участвовать в игре.
                    </p>
                    <Link
                      href="/teams/create"
                      className="btn-primary w-full"
                    >
                      Создать команду
                    </Link>
                  </div>
                )}
              </>
            )}

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
