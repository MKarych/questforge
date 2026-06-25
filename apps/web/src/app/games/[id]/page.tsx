'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicGame, getMyTeams, registerTeam, type GameDetails, type MyTeam } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import ImageModal from '@/components/ui/ImageModal';

const DEFAULT_LOGO = '/images/logo/logo-full-light.svg';

interface GamePageParams {
  [key: string]: string;
  id: string;
}

export default function GameDetailsPage() {
  const params = useParams<GamePageParams>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const gameId = params.id;

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await getPublicGame(gameId);
        setGame(response.data);

        // Fetch user's teams (if logged in)
        try {
          const teamsResponse = await getMyTeams();
          if (teamsResponse.data && Array.isArray(teamsResponse.data)) {
            setMyTeams(teamsResponse.data);
            const lastTeamId = localStorage.getItem('currentTeamId');
            if (lastTeamId && teamsResponse.data.some((t: MyTeam) => t.id === lastTeamId)) {
              setSelectedTeamId(lastTeamId);
            }
          }
        } catch {
          // User not logged in
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить игру');
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !game) return;

    setJoining(true);
    setError(null);
    try {
      const response = await registerTeam(game.id, selectedTeamId);
      localStorage.setItem('currentTeamId', selectedTeamId);
      setSuccess(`Команда "${response.data.team.name}" зарегистрирована на игру!`);
      setTimeout(() => {
        router.push(`/play/${game.shareLink}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться на игру');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-surface rounded-xl mb-6" />
            <div className="h-8 bg-surface rounded mb-4 w-1/2" />
            <div className="h-4 bg-surface rounded mb-2 w-3/4" />
            <div className="h-4 bg-surface rounded w-1/2" />
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
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Game not found'}</p>
            <Link href="/games" className="btn-primary">
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price} ₽`;
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            {game.imageUrl && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="relative w-full h-64 mb-6 rounded-xl overflow-hidden cursor-pointer text-left"
              >
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  quality={85}
                />
              </button>
            )}
            {!game.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-surface-elevated flex items-center justify-center">
                <Image
                  src={DEFAULT_LOGO}
                  alt={game.title}
                  fill
                  className="object-contain p-8"
                  quality={100}
                  unoptimized
                />
              </div>
            )}

            <h1 className="text-3xl font-bold mb-4 text-text-primary">{game.title}</h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="card flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span className="text-text-secondary">{game.city}</span>
              </div>
              <div className="card flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-text-secondary">{game.duration} мин</span>
              </div>
              <div className="card flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-text-secondary">До {game.maxTeams} команд</span>
              </div>
              {game.averageRating > 0 && (
                <div className="card flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-warning font-semibold">{game.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <h2 className="text-xl font-semibold mb-3 text-text-primary">Описание</h2>
              <p className="text-text-secondary">{game.description || 'Описание игры'}</p>
            </div>

            {/* Reviews */}
            {game.reviews.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Отзывы</h2>
                <div className="space-y-4">
                  {game.reviews.map((review) => (
                    <div key={review.id} className="card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-text-primary">{review.user.name}</span>
                        <div className="flex items-center gap-1 text-warning">
                          <span>★</span>
                          <span className="font-medium">{review.rating}</span>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-text-secondary text-sm">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatPrice(game.price)}
                </div>
                <p className="text-text-secondary text-sm">с участника</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{formatDate(game.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm">{game.organizer.name}</span>
                </div>
              </div>

              {success ? (
                <div className="text-center">
                  <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-3">
                    {success}
                  </div>
                  <p className="text-text-secondary text-xs">
                    Перенаправление в лобби...
                  </p>
                </div>
              ) : myTeams.length > 0 ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="label">Выберите команду</label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="input-field"
                      required
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
                    type="submit"
                    disabled={joining || !selectedTeamId}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joining ? 'Регистрация...' : 'Зарегистрироваться на игру'}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/teams/create"
                      className="text-primary hover:text-primary-hover text-sm"
                    >
                      + Создать новую команду
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-text-secondary text-sm">
                    У вас пока нет команд. Создайте команду, чтобы участвовать в игре.
                  </p>
                  <Link
                    href="/teams/create"
                    className="btn-primary w-full inline-block"
                  >
                    Создать команду
                  </Link>
                </div>
              )}

              <p className="text-xs text-text-muted text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с правилами игры
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && game?.imageUrl && (
        <ImageModal
          src={game.imageUrl}
          alt={game.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
