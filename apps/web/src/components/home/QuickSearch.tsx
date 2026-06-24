'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickSearch() {
  const router = useRouter();
  const [game, setGame] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (game) params.append('search', game);
    if (city) params.append('city', city);
    if (date) params.append('dateFrom', date);
    if (category) params.append('type', category);

    router.push(`/games?${params.toString()}`);
  };

  return (
    <section className="mb-16">
      <form
        onSubmit={handleSearch}
        className="bg-surface border border-border rounded-xl p-4 md:p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1">
            <label htmlFor="qs-game" className="block text-xs text-text-muted mb-1 font-medium">
              Игра
            </label>
            <input
              id="qs-game"
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="Название игры"
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="qs-city" className="block text-xs text-text-muted mb-1 font-medium">
              Город
            </label>
            <input
              id="qs-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ваш город"
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label htmlFor="qs-date" className="block text-xs text-text-muted mb-1 font-medium">
              Дата
            </label>
            <input
              id="qs-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark]"
            />
          </div>
          <div>
            <label htmlFor="qs-category" className="block text-xs text-text-muted mb-1 font-medium">
              Категория
            </label>
            <select
              id="qs-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="">Все категории</option>
              <option value="DETECTIVE">Детектив</option>
              <option value="HORROR">Хоррор</option>
              <option value="QUEST">Квест</option>
              <option value="QUIZ">Квиз</option>
              <option value="FAMILY">Семейный</option>
              <option value="CORPORATE">Корпоративный</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              Найти →
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}