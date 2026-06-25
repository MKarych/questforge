'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getMarketplaceListing,
  incrementListingViews,
  getListingReviews,
  purchaseListing,
  addFavoriteListing,
  removeFavoriteListing,
  addToCart,
  createReview,
  type MarketplaceListingDto,
} from '@/lib/api/client';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<MarketplaceListingDto | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadListing = useCallback(async () => {
    try {
      const res = await getMarketplaceListing(id);
      setListing(res.data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await getListingReviews(id);
      setReviews(res.data?.data || res.data || []);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadListing();
    loadReviews();
    incrementListingViews(id).catch(() => {});
  }, [id, loadListing, loadReviews]);

  const handlePurchase = async () => {
    if (!listing) return;
    setPurchasing(true);
    try {
      await purchaseListing(listing.id, { licenseType: listing.licenseType });
      setPurchaseSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Ошибка покупки');
    } finally {
      setPurchasing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!listing) return;
    setAddingToCart(true);
    try {
      await addToCart({ listingId: listing.id, licenseType: listing.licenseType });
      alert('Сценарий добавлен в корзину');
    } catch (err: any) {
      alert(err.message || 'Ошибка добавления в корзину');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!listing) return;
    try {
      if (isFavorite) {
        await removeFavoriteListing(listing.id);
        setIsFavorite(false);
      } else {
        await addFavoriteListing(listing.id);
        setIsFavorite(true);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    }
  };

  const handleSubmitReview = async () => {
    if (!listing) return;
    setSubmittingReview(true);
    try {
      await createReview(listing.id, { rating: reviewRating, text: reviewText || undefined });
      setReviewText('');
      setReviewRating(5);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки отзыва');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <LoadingSpinner />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Сценарий не найден'}</p>
          <Link href="/marketplace" className="text-primary hover:underline">
            ← Вернуться в маркетплейс
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/marketplace" className="hover:text-primary">Маркетплейс</Link>
          <span>/</span>
          <span className="text-text-primary">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {listing.imageUrl ? (
              <div className="aspect-video bg-surface-secondary rounded-xl overflow-hidden mb-6">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-surface-secondary rounded-xl flex items-center justify-center text-text-secondary mb-6">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}

            <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

            {listing.description && (
              <p className="text-text-secondary mb-6 whitespace-pre-wrap">{listing.description}</p>
            )}

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {listing.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-surface-secondary text-text-secondary rounded-lg text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author info */}
            <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-xl mb-6">
              <div className="w-10 h-10 rounded-full bg-surface-secondary overflow-hidden">
                {listing.author.avatarUrl ? (
                  <img src={listing.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
                    {listing.author.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{listing.author.username}</p>
                <p className="text-xs text-text-secondary">Автор сценария</p>
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Отзывы</h2>

              {/* Review form */}
              <div className="bg-surface-elevated rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium mb-3">Оставить отзыв</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-500' : 'text-text-secondary'}`}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Ваш отзыв (необязательно)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                  rows={3}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
                >
                  {submittingReview ? 'Отправка...' : 'Отправить'}
                </button>
              </div>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <p className="text-text-secondary text-sm">Отзывов пока нет</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-surface-elevated rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{review.user?.name || 'Пользователь'}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <svg key={i} className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.text && <p className="text-sm text-text-secondary">{review.text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-surface-elevated rounded-xl p-6 sticky top-24">
              <div className="text-3xl font-bold text-primary mb-2">
                {listing.price === 0 ? 'Бесплатно' : `${listing.price} ₽`}
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Тип лицензии: {listing.licenseType}
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Рейтинг</span>
                  <span>{listing.avgRating > 0 ? listing.avgRating.toFixed(1) : 'Нет оценок'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Продажи</span>
                  <span>{listing.sales}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Просмотры</span>
                  <span>{listing.views}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">В избранном</span>
                  <span>{listing.favorites}</span>
                </div>
              </div>

              {purchaseSuccess ? (
                <div className="text-center py-4">
                  <div className="text-green-500 text-lg mb-2">✓</div>
                  <p className="text-sm text-green-500 font-medium">Сценарий куплен!</p>
                  <Link
                    href="/profile/licenses"
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Мои лицензии →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                  >
                    {purchasing ? 'Оформление...' : 'Купить'}
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full py-2.5 border border-border text-text-secondary rounded-xl hover:bg-surface-secondary transition-colors text-sm disabled:opacity-50"
                  >
                    {addingToCart ? 'Добавление...' : 'В корзину'}
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    className={`w-full py-2.5 border rounded-xl transition-colors text-sm ${
                      isFavorite
                        ? 'border-red-500/30 text-red-500 bg-red-500/5'
                        : 'border-border text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    {isFavorite ? '♥ В избранном' : '♡ В избранное'}
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href={`/organizer/listings`}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  ← Все листинги
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}