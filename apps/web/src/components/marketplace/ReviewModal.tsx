'use client';

import { useState, useEffect } from 'react';
import { createReview, updateReview, deleteReview, getListingReviews } from '@/lib/api/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface ReviewModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewUpdate: () => void;
}

export default function ReviewModal({ listingId, isOpen, onClose, onReviewUpdate }: ReviewModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen, listingId]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getListingReviews(listingId, { limit: 50 });
      setReviews(res.data?.data || res.data || []);
      setTotalReviews(res.data?.meta?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, { rating, text: text || undefined });
      } else {
        await createReview(listingId, { rating, text: text || undefined });
      }
      setRating(5);
      setText('');
      setEditingReviewId(null);
      onReviewUpdate();
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setText(review.text || '');
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await deleteReview(reviewId);
      onReviewUpdate();
      await loadReviews();
    } catch (err: any) {
      setError(err?.message || 'Не удалось удалить отзыв');
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(5);
    setText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">
            {editingReviewId ? 'Редактировать отзыв' : `Отзывы (${totalReviews})`}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 border-b border-border shrink-0">
          <div className="mb-3">
            <label className="block text-sm font-medium text-text-secondary mb-2">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors"
                >
                  <svg
                    className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-text-secondary mb-1">Комментарий (необязательно)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Поделитесь впечатлениями о сценарии..."
              className="input-field w-full h-20 resize-none"
              maxLength={1000}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-4 py-2 text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Сохранение...
                </span>
              ) : editingReviewId ? (
                'Сохранить'
              ) : (
                'Оставить отзыв'
              )}
            </button>
            {editingReviewId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors border border-border rounded-lg"
              >
                Отмена
              </button>
            )}
          </div>
        </form>

        {/* Reviews list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{error}</p>
              <button onClick={loadReviews} className="text-primary hover:underline text-sm">
                Попробовать снова
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon="⭐"
              title="Отзывов пока нет"
              description="Будьте первым, кто оставит отзыв о этом сценарии!"
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {review.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{review.user.name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(review)}
                        className="p-1 text-text-secondary hover:text-primary transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="p-1 text-text-secondary hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-sm text-text-secondary mt-1">{review.text}</p>
                  )}
                  <p className="text-xs text-text-secondary/60 mt-2">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}