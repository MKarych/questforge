'use client';

import { useEffect, useState } from 'react';
import { getPublicGames, type Game } from '@/lib/api/client';
import GameCard from '@/components/ui/GameCard';
import Header from '@/components/ui/Header';

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const response = await getPublicGames();
        setGames(response.data.data);
        
        // Extract unique cities
        const uniqueCities = Array.from(new Set(response.data.data.map((g) => g.city)));
        setCities(uniqueCities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить игры');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  const filteredGames = selectedCity
    ? games.filter((g) => g.city === selectedCity)
    : games;

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text-primary">Каталог игр</h1>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Город</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="input-field"
              >
                <option value="">Все города</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-surface-elevated rounded-lg mb-4" />
                <div className="h-6 bg-surface-elevated rounded mb-2 w-3/4" />
                <div className="h-4 bg-surface-elevated rounded mb-2 w-full" />
                <div className="h-4 bg-surface-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary">
              {selectedCity ? `Игр в городе "${selectedCity}" пока нет` : 'Игр пока нет'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
