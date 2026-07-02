'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getMyAnalyticsSummary,
  getMyEarnings,
  getUnansweredQuestionsCount,
  type User,
  getProfile,
} from '@/lib/api/client';

interface AnalyticsSummary {
  totalRevenue: number;
  totalSales: number;
  totalViews: number;
  avgRating: number;
}

interface SaleItem {
  id: string;
  listingTitle: string;
  buyerName: string;
  amount: number;
  createdAt: string;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await getProfile();
        setUser(profileRes.data);

        const [analyticsRes, earningsRes, unansweredRes] = await Promise.all([
          getMyAnalyticsSummary().catch(() => null),
          getMyEarnings().catch(() => null),
          getUnansweredQuestionsCount().catch(() => null),
        ]);

        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
        if (earningsRes?.data?.items) setRecentSales(earningsRes.data.items.slice(0, 5));
        if (unansweredRes?.data) setUnansweredCount(unansweredRes.data.count);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  const isOrganizer = user.role === 'ORGANIZER' || user.role === 'ADMIN';
  if (!isOrganizer) {
    router.push('/organizer');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0">
            <div className="bg-surface-elevated rounded-xl p-4 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Кабинет продавца</h2>
              <nav className="space-y-1">
                <Link
                  href="/organizer/seller"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium"
                >
                  <span>📊</span>
                  <span>Обзор</span>
                </Link>
                <Link
                  href="/organizer/listings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>📦</span>
                  <span>Мои листинги</span>
                </Link>
                <Link
                  href="/organizer/seller/analytics"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>📊</span>
                  <span>Аналитика</span>
                </Link>
                <Link
                  href="/organizer/seller/questions"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>❓</span>
                  <span>
                    Вопросы
                    {unansweredCount > 0 && (
                      <span className="ml-auto bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unansweredCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/organizer/seller/payouts"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <span>💰</span>
                  <span>Выплаты</span>
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Обзор продаж</h1>
              <Link
                href="/marketplace/create"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                + Создать листинг
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface-elevated rounded-xl p-5">
                <p className="text-sm text-text-secondary mb-1">Доход (всего)</p>
                <p className="text-2xl font-bold">
                  {analytics?.totalRevenue ? `${Number(analytics.totalRevenue).toLocaleString()} ₽` : '0 ₽'}
                </p>
              </div>
              <div className="bg-surface-elevated rounded-xl p-5">
                <p className="text-sm text-text-secondary mb-1">Продажи (всего)</p>
                <p className="text-2xl font-bold">{analytics?.totalSales ?? 0}</p>
              </div>
              <div className="bg-surface-elevated rounded-xl p-5">
                <p className="text-sm text-text-secondary mb-1">Просмотры (всего)</p>
                <p className="text-2xl font-bold">{analytics?.totalViews ?? 0}</p>
              </div>
              <div className="bg-surface-elevated rounded-xl p-5">
                <p className="text-sm text-text-secondary mb-1">Средний рейтинг</p>
                <p className="text-2xl font-bold">
                  {analytics?.avgRating ? analytics.avgRating.toFixed(1) : '—'}
                </p>
              </div>
            </div>

            {/* Unanswered Questions Alert */}
            {unansweredCount > 0 && (
              <Link
                href="/organizer/seller/questions"
                className="block bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 hover:bg-amber-500/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❓</span>
                  <div>
                    <p className="font-medium text-amber-600">
                      {unansweredCount} {unansweredCount === 1 ? 'неотвеченный вопрос' : 'неотвеченных вопросов'}
                    </p>
                    <p className="text-sm text-text-secondary">Нажмите, чтобы ответить</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Recent Sales */}
            <div className="bg-surface-elevated rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Последние продажи</h2>
              {recentSales.length === 0 ? (
                <p className="text-text-secondary text-sm">Продаж пока нет</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{sale.listingTitle}</p>
                        <p className="text-xs text-text-secondary">
                          {sale.buyerName} · {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-500">
                        +{Number(sale.amount).toLocaleString()} ₽
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}