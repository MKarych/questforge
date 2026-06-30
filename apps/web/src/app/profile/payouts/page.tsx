'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  getMyPayouts,
  getMyBalance,
  requestPayout,
} from '@/lib/api/client';

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState<{ available: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [payoutsRes, balanceRes] = await Promise.all([
          getMyPayouts(),
          getMyBalance(),
        ]);
        setPayouts(payoutsRes.data?.items || []);
        setBalance(balanceRes.data);
      } catch {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRequestPayout = async () => {
    if (payoutAmount <= 0) return;
    setRequesting(true);
    setError(null);
    try {
      await requestPayout({ amount: payoutAmount });
      setSuccess(`Запрос на выплату ${payoutAmount} ₽ отправлен`);
      setPayoutAmount(0);
      // Refresh
      const [payoutsRes, balanceRes] = await Promise.all([
        getMyPayouts(),
        getMyBalance(),
      ]);
      setPayouts(payoutsRes.data?.items || []);
      setBalance(balanceRes.data);
    } catch (err: any) {
      setError(err.message || 'Ошибка запроса выплаты');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Ожидает',
      PROCESSING: 'В обработке',
      COMPLETED: 'Выплачено',
      REJECTED: 'Отклонено',
      CANCELLED: 'Отменено',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-yellow-500',
      PROCESSING: 'text-blue-500',
      COMPLETED: 'text-green-500',
      REJECTED: 'text-red-500',
      CANCELLED: 'text-gray-500',
    };
    return colors[status] || '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/profile/edit" className="text-primary hover:underline text-sm">
            ← Настройки профиля
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Выплаты</h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">{success}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">История выплат</h2>
              {payouts.length === 0 ? (
                <EmptyState icon="💰" title="Нет выплат" description="Зарабатывайте на продаже сценариев" />
              ) : (
                <div className="space-y-3">
                  {payouts.map(p => (
                    <div key={p.id} className="card p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{p.amount} ₽</p>
                        <p className="text-sm text-text-secondary">
                          {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <span className={`font-medium ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="card p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Баланс</h3>
                {balance && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Доступно</span>
                      <span className="font-bold text-green-500">{balance.available} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Ожидает</span>
                      <span className="text-yellow-500">{balance.pending} ₽</span>
                    </div>
                  </div>
                )}

                <h4 className="font-medium mb-2">Запросить выплату</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Сумма"
                  />
                  <button
                    onClick={handleRequestPayout}
                    disabled={requesting || payoutAmount <= 0}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {requesting ? <LoadingSpinner size="sm" /> : 'Запросить'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}