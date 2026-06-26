'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getCart,
  checkoutCart,
  validatePromo,
} from '@/lib/api/client';

interface CartItem {
  id: string;
  listingId: string;
  listing: { title: string; price: number };
  licenseType: string;
  price: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getCart();
        setItems(res.data?.items || []);
      } catch {
        setError('Ошибка загрузки корзины');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError(null);
    try {
      const res = await validatePromo({
        code: promoCode,
        listingId: items[0]?.listingId || '',
        amount: total,
      });
      setDiscount(res.data?.discount || 0);
    } catch (err: any) {
      setPromoError(err.message || 'Неверный промокод');
      setDiscount(0);
    }
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setError(null);
    try {
      await checkoutCart();
      setSuccess(true);
      setTimeout(() => router.push('/marketplace/me/purchases'), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка оформления заказа');
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = Math.max(0, subtotal - discount);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Заказ оформлен!</h1>
          <p className="text-text-secondary mb-8">Спасибо за покупку. Лицензии уже доступны в вашем профиле.</p>
          <Link href="/marketplace/me/purchases" className="btn-primary">
            Мои покупки
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Состав заказа</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="card p-4 flex justify-between">
                  <div>
                    <p className="font-medium">{item.listing.title}</p>
                    <p className="text-sm text-text-secondary">Лицензия: {item.licenseType}</p>
                  </div>
                  <p className="font-bold">{item.price} ₽</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Промокод</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите промокод"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-card transition-colors"
                >
                  Применить
                </button>
              </div>
              {promoError && <p className="text-sm text-red-500 mt-1">{promoError}</p>}
              {discount > 0 && <p className="text-sm text-green-500 mt-1">Скидка: {discount} ₽</p>}
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Итого</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Товары</span>
                  <span>{subtotal} ₽</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Скидка</span>
                    <span>-{discount} ₽</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>К оплате</span>
                    <span>{total} ₽</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={processing || items.length === 0}
                className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
              >
                {processing ? <LoadingSpinner size="sm" /> : `Оплатить ${total} ₽`}
              </button>
              <Link
                href="/cart"
                className="block text-center text-sm text-text-secondary hover:text-text-primary mt-3"
              >
                ← Вернуться в корзину
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}