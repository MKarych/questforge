'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { getFavorites, removeFavorite } from '@/lib/api/client';

interface FavoriteItem {
  id: string;
  category: string;
  itemId: string;
  createdAt: string;
  item?: any;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFavorites('me');
      const items: FavoriteItem[] = (res.data || []).map((item: any) => ({
        id: item.id,
        category: item.category || 'games',
        itemId: item.id,
        createdAt: item.createdAt || '',
        item: item,
      }));
      setFavorites(items);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки избранного');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemove = async (category: string, itemId: string) => {
    try {
      await removeFavorite(category, itemId);
      setFavorites((prev) => prev.filter((f) => !(f.category === category && f.itemId === itemId)));
    } catch (err: any) {
      alert(err?.message || 'Ошибка удаления');
    }
  };

  const categories = ['all', ...new Set(favorites.map((f) => f.category))];
  const filtered = activeCategory === 'all'
    ? favorites
    : favorites.filter((f) => f.category === activeCategory);

  const categoryLabels: Record<string, string> = {
    all: 'Всё',
    games: 'Игры',
    scenarios: 'Сценарии',
    authors: 'Авторы',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <button onClick={() => window.history.back()} className="hover:text-primary">← Назад</button>
          <span>/</span>
          <span className="text-text-primary">Избранное</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-6">Избранное</h1>

        {/* Category tabs */}
        <div className="flex gap-1 mb-6 bg-surface-secondary rounded-lg p-1 w-fit flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={loadFavorites} className="text-primary hover:underline text-sm">
              Попробовать снова
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="Избранное пусто"
            description="Добавляйте игры, сценарии и авторов в избранное"
            ctaText="В каталог"
            ctaLink="/marketplace"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((fav) => (
              <div key={`${fav.category}-${fav.itemId}`} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-surface-secondary rounded text-text-secondary">
                        {categoryLabels[fav.category] || fav.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {fav.item?.title || fav.item?.name || fav.itemId}
                    </p>
                    <p className="text-xs text-text-secondary/60 mt-1">
                      {new Date(fav.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(fav.category, fav.itemId)}
                    className="p-1.5 text-text-secondary hover:text-red-400 transition-colors shrink-0"
                    title="Удалить из избранного"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}