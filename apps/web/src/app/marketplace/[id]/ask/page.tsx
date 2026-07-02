'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getMarketplaceListing,
  askListingQuestion,
  type MarketplaceListingDto,
} from '@/lib/api/client';

export default function AskQuestionPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<MarketplaceListingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        const res = await getMarketplaceListing(id);
        setListing(res.data);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadListing();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await askListingQuestion(id, question);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке вопроса');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/marketplace" className="text-primary hover:underline">
              ← Вернуться в маркетплейс
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/marketplace" className="hover:text-primary">Маркетплейс</Link>
            <span>/</span>
            <Link href={`/marketplace/${id}`} className="hover:text-primary">
              {listing?.title || 'Сценарий'}
            </Link>
            <span>/</span>
            <span className="text-text-primary">Задать вопрос</span>
          </div>

          {submitted ? (
            <div className="bg-surface-elevated rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-2">Вопрос отправлен продавцу</h1>
              <p className="text-text-secondary mb-6">
                Продавец получит ваш вопрос и ответит в ближайшее время.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/marketplace/${id}`}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Вернуться к сценарию
                </Link>
                <Link
                  href="/marketplace"
                  className="px-6 py-2.5 border border-border text-text-secondary rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  В маркетплейс
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-elevated rounded-xl p-6">
              <h1 className="text-2xl font-bold mb-2">Задать вопрос продавцу</h1>
              {listing && (
                <p className="text-text-secondary mb-6">
                  К сценарию: <Link href={`/marketplace/${id}`} className="text-primary hover:underline">{listing.title}</Link>
                </p>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ваш вопрос</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Опишите, что вас интересует. Например: 'Подойдёт ли этот сценарий для игры в лесу?'"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary min-h-[140px]"
                    rows={5}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !question.trim()}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Отправка...' : 'Отправить вопрос'}
                  </button>
                  <Link
                    href={`/marketplace/${id}`}
                    className="px-6 py-2.5 border border-border text-text-secondary rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    Отмена
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}