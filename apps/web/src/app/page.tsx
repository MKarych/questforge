'use client';

import { useEffect, useState, useCallback } from 'react';
import { getHomePage, type HomePageResponse } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import HeroBlock from '@/components/home/HeroBlock';
import StatsBar from '@/components/home/StatsBar';
import QuickSearch from '@/components/home/QuickSearch';
import LiveActivity from '@/components/home/LiveActivity';
import GamesSection from '@/components/home/GamesSection';
import TrendingSection from '@/components/home/TrendingSection';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import OrganizersSection from '@/components/home/OrganizersSection';
import TeamsSection from '@/components/home/TeamsSection';
import WinnersSection from '@/components/home/WinnersSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import EventsCalendar from '@/components/home/EventsCalendar';
import MapPreview from '@/components/home/MapPreview';
import WhyUs from '@/components/home/WhyUs';
import FAQBlock from '@/components/home/FAQBlock';
import CTABlock from '@/components/home/CTABlock';
import MyActiveGames from '@/components/game/MyActiveGames';

export default function HomePage() {
  const [data, setData] = useState<HomePageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadHomePage = useCallback(async () => {
    try {
      setError(null);
      const response = await getHomePage();
      setData(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить страницу';
      setError(message);

      // Автоматический retry (3 попытки с экспоненциальной задержкой)
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    loadHomePage();
  }, [loadHomePage]);

  const featureFlags = data?.featureFlags || {
    search: true,
    notifications: true,
    marketplace: false,
    ai: false,
    reviews: true,
    chat: false,
    liveActivity: true,
    mapPreview: false,
    partners: false,
    press: false,
    downloadApp: false,
  };

  // Глобальная ошибка — вся страница не загрузилась
  if (error && !data && retryCount >= 3) {
    return (
      <div className="min-h-screen">
        <Header systemStatus={null} featureFlags={featureFlags} />
        <div className="container mx-auto px-4 py-20">
          <div className="card border-error/30 bg-error/5 text-center py-16 max-w-lg mx-auto">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Не удалось загрузить страницу
            </h2>
            <p className="text-sm text-text-secondary mb-6">{error}</p>
            <button
              onClick={() => {
                setRetryCount(0);
                setLoading(true);
                loadHomePage();
              }}
              className="btn-primary"
            >
              Повторить
            </button>
          </div>
        </div>
        <Footer featureFlags={featureFlags} stats={null} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header systemStatus={data?.systemStatus || null} featureFlags={featureFlags} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Hero */}
          <HeroBlock hero={data?.hero || null} loading={loading} />

          {/* My Active Games */}
          <MyActiveGames />

          {/* Stats */}
          <StatsBar stats={data?.stats || null} loading={loading} />

          {/* Quick Search */}
          <QuickSearch />

          {/* Live Activity */}
          <LiveActivity enabled={featureFlags.liveActivity} />

          {/* Featured Games */}
          <GamesSection
            title="Доступные игры"
            link="/games"
            games={data?.games?.featured || null}
            loading={loading}
          />

          {/* Popular Games */}
          <GamesSection
            title="Популярные игры"
            link="/games?sort=popular"
            games={data?.games?.popular || null}
            loading={loading}
          />

          {/* Recent Games */}
          <GamesSection
            title="Новые игры"
            link="/games?sort=recent"
            games={data?.games?.recent || null}
            loading={loading}
          />

          {/* Trending */}
          <TrendingSection
            games={data?.games?.trending || null}
            loading={loading}
          />

          {/* Categories */}
          <CategoriesGrid categories={data?.categories || null} />

          {/* Organizers */}
          <OrganizersSection
            organizers={data?.topOrganizers || null}
            loading={loading}
          />

          {/* Teams */}
          <TeamsSection
            teams={data?.topTeams || null}
            loading={loading}
          />

          {/* Winners */}
          <WinnersSection
            winners={data?.recentWinners || null}
            loading={loading}
          />

          {/* Reviews */}
          {featureFlags.reviews && (
            <ReviewsSection
              reviews={data?.recentReviews || null}
              loading={loading}
            />
          )}

          {/* Events Calendar */}
          <EventsCalendar />

          {/* Map Preview (Feature Flag) */}
          <MapPreview enabled={featureFlags.mapPreview} />

          {/* Why Us */}
          <WhyUs />

          {/* FAQ */}
          <FAQBlock items={data?.faq || null} loading={loading} />

          {/* CTA */}
          <CTABlock />
        </div>
      </main>

      <Footer featureFlags={featureFlags} stats={data?.stats || null} />
    </div>
  );
}
