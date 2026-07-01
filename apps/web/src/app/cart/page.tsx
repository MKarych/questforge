'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  getCart,
  removeFromCart,
  clearCart,
  checkoutCart,
  type MarketplaceListingDto,
} from '@/lib/api/client';

interface CartItem {
  id: string;
  listingId: string;
  listing: MarketplaceListingDto;
  licenseType: string;
  price: number;
  addedAt: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCart();
      setItems(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки корзины');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setItems([]);
    } catch (err: any) {
      setError(err.message || 'Ошибка очистки корзины');
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      await checkoutCart();
      setSuccess('Заказ оформлен!');
      setItems([]);
      setTimeout(() => router.push('/marketplace/me/purchases'), 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка оформления заказа');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Корзина</h1>
            <p className="text-text-secondary mt-1">
              {items.length} {items.length === 1 ? 'товар' : items.length >= 2 && items.length <= 4 ? 'товара' : 'товаров'}
            </p>
          </div>
          <Link href="/marketplace" className="text-primary hover:underline text-sm">
            ← Продолжить покупки
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Корзина пуста"
            description="Добавьте сценарии из маркетплейса"
            ctaText="В маркетплейс"
            ctaLink="/marketplace"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.id} className="card p-4 flex gap-4">
                  <div className="w-20 h-20 bg-card-hover rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
                    📜
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${item.listingId}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.listing.title}
                    </Link>
                    <p className="text-sm text-text-secondary mt-1">
                      Лицензия: {item.licenseType}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {item.listing.author?.username}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{item.price} ₽</p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-sm text-red-500 hover:text-red-600 mt-2"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleClear}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Очистить корзину
              </button>
            </div>

            <div className="card p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Итого</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Товары ({items.length})</span>
                  <span>{total} ₽</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>К оплате</span>
                    <span>{total} ₽</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-6 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
              >
                {checkoutLoading ? <LoadingSpinner size="sm" /> : 'Оформить заказ'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}