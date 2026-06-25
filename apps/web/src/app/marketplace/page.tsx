'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  searchMarketplace,
  getMarketplaceCategories,
  getMarketplaceTypes,
  type MarketplaceListingDto,
  type MarketplaceSearchParams,
} from '@/lib/api/client';

const ITEMS_PER_PAGE = 12;

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListingDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [sort, setSort] = useState('newest');
  const [offset, setOffset] = useState(0);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: MarketplaceSearchParams = {
        limit: ITEMS_PER_PAGE,
        offset,
        sort,
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (licenseType) params.licenseType = licenseType;

      const res = await searchMarketplace(params);
      setListings(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки маркетплейса');
    } finally {
      setLoading(false);
    }
  }, [search, category, licenseType, sort, offset]);

  const loadFilters = useCallback(async () => {
    try {
      const [catRes, typeRes] = await Promise.all([
        getMarketplaceCategories(),
        getMarketplaceTypes(),
      ]);
      setCategories(catRes.data);
      setLicenseTypes(typeRes.data);
    } catch {
      // ignore filter load errors
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = Math.floor(offset / ITEMS_PER_PAGE) + 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Маркетплейс сценариев</h1>
            <p className="text-text-secondary mt-1">
              Покупайте и продавайте готовые сценарии для своих игр
            </p>
          </div>
          <Link
            href="/organizer/listings"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            Мои листинги
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-surface-elevated rounded-xl p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-text-secondary mb-1">Поиск</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название, описание..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setOffset(0); }}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все категории</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Тип лицензии</label>
              <select
                value={licenseType}
                onChange={(e) => { setLicenseType(e.target.value); setOffset(0); }}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Все типы</option>
                {licenseTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-text-secondary mb-1">Сортировка</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setOffset(0); }}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Новые</option>
                <option value="popular">Популярные</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="rating">Рейтинг</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
            >
              Найти
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Повторить
            </button>
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Сценариев не найдено"
            description="Попробуйте изменить параметры поиска"
          />
        ) : (
          <>
            <div className="text-sm text-text-secondary mb-4">
              Найдено: {total} сценариев
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="bg-surface-elevated rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  {listing.imageUrl ? (
                    <div className="aspect-video bg-surface-secondary overflow-hidden">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-surface-secondary flex items-center justify-center text-text-secondary">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                      <span className="text-lg font-bold text-primary whitespace-nowrap ml-2">
                        {listing.price === 0 ? 'Бесплатно' : `${listing.price} ₽`}
                      </span>
                    </div>

                    {listing.description && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {listing.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      {listing.avgRating > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {listing.avgRating.toFixed(1)}
                        </span>
                      )}
                      <span>{listing.sales} продаж</span>
                      <span>{listing.favorites} в избранном</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {listing.licenseType}
                      </span>
                      {listing.category && (
                        <span className="text-xs px-2 py-0.5 bg-surface-secondary text-text-secondary rounded-full">
                          {listing.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setOffset(Math.max(0, offset - ITEMS_PER_PAGE))}
                  disabled={offset === 0}
                  className="px-3 py-2 bg-surface-elevated rounded-lg text-sm disabled:opacity-50 hover:bg-surface-secondary transition-colors"
                >
                  ← Назад
                </button>
                <span className="text-sm text-text-secondary">
                  {currentPage} из {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + ITEMS_PER_PAGE)}
                  disabled={offset + ITEMS_PER_PAGE >= total}
                  className="px-3 py-2 bg-surface-elevated rounded-lg text-sm disabled:opacity-50 hover:bg-surface-secondary transition-colors"
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}