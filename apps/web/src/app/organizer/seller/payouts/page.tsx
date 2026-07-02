'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  getMyBalance,
  requestPayout,
  getMyPayouts,
  getMyEarningsHistory,
  getUnansweredQuestionsCount,
  type User,
  getProfile,
} from '@/lib/api/client';

// ==================== Types ====================

interface BalanceData {
  available: number;
  pending: number;
  total: number;
}

interface PayoutItem {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt: string | null;
  method?: string;
}

interface EarningsItem {
  id: string;
  listingTitle: string;
  buyerName: string;
  amount: number;
  createdAt: string;
  status: string;
}

const PAYOUT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ожидает', className: 'bg-warning/10 text-warning' },
  processing: { label: 'В обработке', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Выплачено', className: 'bg-success/10 text-success' },
  failed: { label: 'Ошибка', className: 'bg-error/10 text-error' },
  cancelled: { label: 'Отменён', className: 'bg-surface-elevated text-text-secondary' },
};

// ==================== Helpers ====================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ==================== Main Page ====================

export default function SellerPayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [unansweredCount, setUnansweredCount] = useState(0);

  // Payout request form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const profileRes = await getProfile();
      setUser(profileRes.data);

      const role = profileRes.data.role;
      if (role !== 'ORGANIZER' && role !== 'ADMIN') {
        router.push('/organizer');
        return;
      }

      const [balanceRes, payoutsRes, earningsRes, unansweredRes] = await Promise.all([
        getMyBalance().catch(() => null),
        getMyPayouts({ limit: 50 }).catch(() => null),
        getMyEarningsHistory({ limit: 20 }).catch(() => null),
        getUnansweredQuestionsCount().catch(() => null),
      ]);

      if (balanceRes?.data) setBalance(balanceRes.data);
      if (Array.isArray(payoutsRes?.data)) setPayouts(payoutsRes.data);
      if (Array.isArray(earningsRes?.data)) setEarnings(earningsRes.data);
      if (unansweredRes?.data) setUnansweredCount(unansweredRes.data.count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить данные';
      setError(message);
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount < 100) {
      setRequestError('Минимальная сумма выплаты — 100 ₽');
      return;
    }

    if (balance && amount > balance.available) {
      setRequestError('Недостаточно средств на балансе');
      return;
    }

    try {
      setRequestLoading(true);
      setRequestError(null);
      setRequestSuccess(null);

      await requestPayout({ amount });
      setRequestSuccess(`Запрос на выплату ${formatPrice(amount)} успешно создан`);
      setPayoutAmount('');

      // Reload data
      const [balanceRes, payoutsRes] = await Promise.all([
        getMyBalance().catch(() => null),
        getMyPayouts({ limit: 50 }).catch(() => null),
      ]);
      if (balanceRes?.data) setBalance(balanceRes.data);
      if (Array.isArray(payoutsRes?.data)) setPayouts(payoutsRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при запросе выплаты';
      setRequestError(message);
    } finally {
      setRequestLoading(false);
    }
  };

  // ==================== Loading State ====================

  if (loading && !balance) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner size="lg" className="py-20" />
      </div>
    );
  }

  // ==================== Error State ====================

  if (error && !balance) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">
              Повторить
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // ==================== Render ====================

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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium"
                >
                  <span>💰</span>
                  <span>Выплаты</span>
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-8">Выплаты</h1>

            {/* Success Notification */}
            {requestSuccess && (
              <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-3">
                <span className="text-success text-lg">✅</span>
                <p className="text-sm text-success font-medium">{requestSuccess}</p>
                <button
                  onClick={() => setRequestSuccess(null)}
                  className="ml-auto text-success/60 hover:text-success"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-6 flex-col lg:flex-row">
              {/* Left Column — Payout History (2/3) */}
              <div className="flex-1 lg:w-2/3">
                <div className="bg-surface-elevated rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">История выплат</h2>

                  {payouts.length === 0 ? (
                    <EmptyState
                      icon="💰"
                      title="Выплат пока нет"
                      description="Когда вы заработаете первые деньги, история выплат появится здесь"
                    />
                  ) : (
                    <div className="space-y-3">
                      {payouts.map((payout) => {
                        const statusConfig = PAYOUT_STATUS_CONFIG[payout.status] ?? {
                          label: payout.status,
                          className: 'bg-surface-elevated text-text-secondary',
                        };

                        return (
                          <div
                            key={payout.id}
                            className="flex items-center justify-between py-3 border-b border-border last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {formatPrice(payout.amount)}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {formatDate(payout.createdAt)}
                                {payout.completedAt && ` · Выплачено: ${formatDate(payout.completedAt)}`}
                              </p>
                            </div>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusConfig.className}`}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column — Balance (1/3, sticky) */}
              <div className="lg:w-1/3">
                <div className="bg-surface-elevated rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4">Баланс</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-text-secondary">Доступно</span>
                      <span className="text-lg font-bold text-green-500">
                        {formatPrice(balance?.available ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-border">
                      <span className="text-sm text-text-secondary">Ожидает</span>
                      <span className="text-lg font-bold text-warning">
                        {formatPrice(balance?.pending ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-border">
                      <span className="text-sm text-text-secondary">Всего</span>
                      <span className="text-lg font-bold text-text-primary">
                        {formatPrice(balance?.total ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Payout Request Form */}
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-medium mb-3">Запросить выплату</h3>

                    {requestError && (
                      <p className="text-xs text-error mb-2">{requestError}</p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={100}
                        step={100}
                        placeholder="Сумма (мин. 100 ₽)"
                        value={payoutAmount}
                        onChange={(e) => {
                          setPayoutAmount(e.target.value);
                          setRequestError(null);
                        }}
                        disabled={requestLoading}
                        className="flex-1 px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      />
                      <button
                        onClick={handleRequestPayout}
                        disabled={requestLoading || !payoutAmount || Number(payoutAmount) < 100}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {requestLoading ? '...' : 'Запросить'}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Минимальная сумма выплаты — 100 ₽
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings History */}
            <div className="bg-surface-elevated rounded-xl p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">История доходов</h2>

              {earnings.length === 0 ? (
                <p className="text-text-secondary text-sm">Продаж пока нет</p>
              ) : (
                <div className="space-y-3">
                  {earnings.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.listingTitle}</p>
                        <p className="text-xs text-text-secondary">
                          {item.buyerName} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span className="text-sm font-medium text-green-500">
                          +{formatPrice(item.amount)}
                        </span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          item.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : item.status === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-surface-elevated text-text-secondary'
                        }`}>
                          {item.status === 'completed' ? 'Завершён' :
                           item.status === 'pending' ? 'Ожидает' : item.status}
                        </span>
                      </div>
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