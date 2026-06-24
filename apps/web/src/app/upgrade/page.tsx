'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface UserLimits {
  id: string;
  userId: string;
  tier: 'FREE' | 'PRO' | 'BUSINESS';
  aiGenerationsToday: number;
  aiGenerationsLimit: number;
  gamesLimit: number;
  teamsLimit: number;
  analyticsLevel: string;
  marketplaceAccess: boolean;
  exportEnabled: boolean;
  expiresAt: string | null;
}

const TIERS = [
  {
    id: 'FREE' as const,
    name: 'Free',
    price: '0 ₽',
    period: '',
    color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    accent: '',
    features: [
      '3 генерации AI в день',
      '1 игра',
      '10 команд',
      'Базовая аналитика',
    ],
    buttonClass: 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700 text-gray-500',
    buttonText: 'Текущий',
  },
  {
    id: 'PRO' as const,
    name: 'PRO',
    price: '990 ₽',
    period: '/мес',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
    features: [
      '50 генераций AI в день',
      '10 игр',
      '50 команд',
      'Расширенная аналитика',
      'Доступ к маркетплейсу',
      'Экспорт данных',
    ],
    buttonClass: 'bg-blue-600 text-white hover:bg-blue-700',
    buttonText: 'Купить',
  },
  {
    id: 'BUSINESS' as const,
    name: 'Business',
    price: '2 990 ₽',
    period: '/мес',
    color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    accent: '',
    features: [
      '500 генераций AI в день',
      '100 игр',
      '500 команд',
      'Полная аналитика',
      'Доступ к маркетплейсу',
      'Экспорт данных',
    ],
    buttonClass: 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-300',
    buttonText: 'Купить',
  },
];

export default function UpgradePage() {
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'PRO' | 'BUSINESS'>('PRO');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    loadLimits();
  }, []);

  async function loadLimits() {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/billing/limits');
      setLimits(res.data);
    } catch (err) {
      console.error('Failed to load limits:', err);
    } finally {
      setLoading(false);
    }
  }

  const isCurrentTier = (tierId: string) => limits?.tier === tierId;

  const handlePayment = async () => {
    setPaymentStatus('processing');
    setPaymentMessage('');

    try {
      // Шаг 1: создаём платёж
      const createRes: any = await apiClient.post('/billing/payment/create', { tier: selectedTier });
      const payment = createRes.data;

      // Шаг 2: имитация ожидания 2 секунды (как в спецификации)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Шаг 3: подтверждаем платёж
      const confirmRes: any = await apiClient.post('/billing/payment/confirm', { paymentId: payment.id });

      setPaymentStatus('success');
      setPaymentMessage(confirmRes.data?.message || '✅ Оплата успешно проведена!');

      // Обновляем лимиты
      await loadLimits();
    } catch (err: any) {
      setPaymentStatus('error');
      setPaymentMessage(err.message || '❌ Ошибка оплаты. Попробуйте снова.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          На главную
        </Link>
        <h1 className="text-4xl font-bold mb-3">💰 Тарифы</h1>
        <p className="text-text-secondary text-lg">
          Выберите тариф, который подходит вашим задачам
        </p>
        {limits && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <span>Текущий тариф:</span>
            <span className="font-bold">{limits.tier === 'FREE' ? 'Free' : limits.tier === 'PRO' ? 'PRO' : 'Business'}</span>
          </div>
        )}
      </div>

      {/* Тарифы */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {TIERS.map((tier) => {
          const isCurrent = isCurrentTier(tier.id);
          const isPaid = tier.id !== 'FREE';

          return (
            <div
              key={tier.id}
              className={`relative border-2 rounded-xl p-6 transition-all duration-200 ${tier.color} ${
                isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Текущий
                </div>
              )}

              <h3 className={`text-xl font-bold mb-1 ${tier.accent || 'text-text-primary'}`}>
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-text-primary">{tier.price}</span>
                {tier.period && (
                  <span className="text-text-secondary text-sm">{tier.period}</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              {isPaid && (
                <button
                  onClick={() => {
                    setSelectedTier(tier.id);
                    document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all ${tier.buttonClass} ${
                    selectedTier === tier.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                >
                  {tier.buttonText}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Форма оплаты */}
      <div id="payment-section" className="max-w-md mx-auto">
        <div className="border rounded-xl p-6 bg-white dark:bg-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">💳 Оплата</h2>
          <p className="text-sm text-text-secondary mb-4">
            Тариф: <span className="font-bold text-primary">{selectedTier}</span> —{' '}
            {selectedTier === 'PRO' ? '990 ₽/мес' : '2 990 ₽/мес'}
          </p>

          <div className="space-y-4">
            {/* Номер карты */}
            <div>
              <label className="block text-sm font-medium mb-1">Номер карты</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                maxLength={19}
              />
            </div>

            {/* Срок и CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Срок</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Кнопка оплаты */}
            <button
              onClick={handlePayment}
              disabled={paymentStatus === 'processing'}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paymentStatus === 'processing' ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Обработка...
                </>
              ) : (
                '💳 Оплатить'
              )}
            </button>

            {/* Статус */}
            {paymentStatus === 'success' && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                  <span>✅</span>
                  {paymentMessage}
                </p>
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <span>❌</span>
                  {paymentMessage}
                </p>
              </div>
            )}

            {/* Информация о безопасности */}
            <p className="text-xs text-center text-text-secondary pt-2">
              🔒 Безопасная оплата. Данные не сохраняются.
            </p>
            <p className="text-xs text-center text-text-secondary">
              Тестовый режим. Используйте карту <span className="font-mono font-bold">4242 4242 4242 4242</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}