'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicGames, type Game } from '@/lib/api/client';
import GameCard from '@/components/ui/GameCard';
import Header from '@/components/ui/Header';

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const response = await getPublicGames({ limit: 6 });
        setGames(response.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить игры');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo/logo.png"
                alt="Adventure Engine"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="text-2xl font-bold text-white">
                Город Приключений
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Городские игры нового поколения
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
              Присоединяйтесь к захватывающим квестам в вашем городе или создайте свою собственную игру
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/games" className="btn-primary">
                Выбрать игру
              </Link>
              <Link href="/organizer" className="btn-secondary">
                Стать организатором
              </Link>
            </div>
          </div>
        </section>

        {/* Games Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Доступные игры</h2>
            <Link href="/games" className="text-primary hover:text-primary-hover font-medium">
              Смотреть все →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-surface-elevated rounded-lg mb-4" />
                  <div className="h-6 bg-surface-elevated rounded mb-2 w-3/4" />
                  <div className="h-4 bg-surface-elevated rounded mb-2 w-full" />
                  <div className="h-4 bg-surface-elevated rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card border-error">
              <p className="text-error">{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-secondary">Игр пока нет. Будьте первыми!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Увлекательные задания</h3>
            <p className="text-text-secondary">
              Разнообразные типы миссий: от логических загадок до поиска локаций
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Командная игра</h3>
            <p className="text-text-secondary">
              Играйте вместе с друзьями в режиме реального времени
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold mb-2">Соревновательный дух</h3>
            <p className="text-text-secondary">
              Состязайтесь с другими командами за первое место
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
