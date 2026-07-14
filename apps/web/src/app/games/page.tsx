'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPublicGames, getArchivedGames, type Game } from '@/lib/api/client';
import GameCard from '@/components/ui/GameCard';
import Header from '@/components/ui/Header';

type TabType = 'active' | 'archived';

export default function GamesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);
  const [_error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'archived' ? 'archived' : 'active');
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthenticated = typeof window !== 'undefined'
    ? !!localStorage.getItem('auth_token')
    : false;

  const loadGames = useCallback(async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'active') {
        const response = await getPublicGames();
        setGames(response.data.data);
        // Extract unique cities from active games
        const uniqueCities = Array.from(new Set(response.data.data.map((g) => g.city)));
        setCities(uniqueCities);
      } else {
        // Archived — только для авторизованных
        if (!isAuthenticated) {
          setGames([]);
          setCities([]);
          setLoading(false);
          return;
        }
        const response = await getArchivedGames({
          city: selectedCity || undefined,
        });
        setGames(response.data.data);
        // Extract unique cities from archived games
        const uniqueCities = Array.from(new Set(response.data.data.map((g) => g.city)));
        setCities(uniqueCities);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить игры');
      setGames([]);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [selectedCity, isAuthenticated]);

  useEffect(() => {
    loadGames(activeTab);
  }, [activeTab, loadGames]);

  // Перезагружаем при смене города
  useEffect(() => {
    if (authChecked) {
      loadGames(activeTab);
    }
  }, [selectedCity]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCity('');
    // Обновляем URL без перезагрузки страницы
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'archived') {
      params.set('tab', 'archived');
    } else {
      params.delete('tab');
    }
    const newQuery = params.toString();
    router.replace(`/games${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
  };

  const filteredGames = selectedCity
    ? games.filter((g) => g.city === selectedCity)
    : games;

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-text-primary">Каталог игр</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => handleTabChange('active')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'active'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted'
            }`}
          >
            Актуальные
          </button>
          <button
            onClick={() => handleTabChange('archived')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'archived'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary hover:border-text-muted'
            }`}
          >
            Архив
          </button>
        </div>

        {/* Filters */}
        {games.length > 0 && (
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
        )}

        {/* Content */}
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
        ) : activeTab === 'archived' && !isAuthenticated ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary mb-4">
              🔒 Войдите, чтобы просмотреть архив игр
            </p>
            <a href="/auth/login" className="btn-primary inline-block">
              Войти
            </a>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-text-secondary">
              {selectedCity
                ? `Игр в городе "${selectedCity}" пока нет`
                : activeTab === 'active'
                  ? 'Актуальных игр пока нет'
                  : 'Архивных игр пока нет'}
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
