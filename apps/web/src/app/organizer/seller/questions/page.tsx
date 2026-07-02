'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getSellerQuestions,
  answerListingQuestion,
  getUnansweredQuestionsCount,
  type ListingQuestionDto,
  type User,
  getProfile,
} from '@/lib/api/client';

type FilterType = 'all' | 'unanswered' | 'answered';

export default function SellerQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ListingQuestionDto[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await getProfile();
        setUser(profileRes.data);

        const [questionsRes, unansweredRes] = await Promise.all([
          getSellerQuestions(),
          getUnansweredQuestionsCount().catch(() => null),
        ]);

        if (questionsRes?.data) setQuestions(questionsRes.data);
        if (unansweredRes?.data) setUnansweredCount(unansweredRes.data.count);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await answerListingQuestion(questionId, answerText);
      setAnswerText('');
      setAnsweringId(null);
      // Reload questions
      const res = await getSellerQuestions();
      if (res?.data) setQuestions(res.data);
      const unansweredRes = await getUnansweredQuestionsCount().catch(() => null);
      if (unansweredRes?.data) setUnansweredCount(unansweredRes.data.count);
    } catch (err: any) {
      alert(err.message || 'Ошибка при отправке ответа');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'unanswered') return !q.answer;
    if (filter === 'answered') return q.answer;
    return true;
  });

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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium"
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
            <h1 className="text-2xl font-bold mb-6">Вопросы покупателей</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {(['all', 'unanswered', 'answered'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'bg-surface-elevated text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  {f === 'all' && 'Все'}
                  {f === 'unanswered' && `Неотвеченные (${unansweredCount})`}
                  {f === 'answered' && 'Отвеченные'}
                </button>
              ))}
            </div>

            {/* Questions list */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-surface-elevated rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-text-secondary">
                  {filter === 'all'
                    ? 'Вопросов пока нет'
                    : filter === 'unanswered'
                    ? 'Нет неотвеченных вопросов'
                    : 'Нет отвеченных вопросов'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="bg-surface-elevated rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-secondary overflow-hidden flex items-center justify-center text-xs text-text-secondary">
                          {q.user.avatarUrl ? (
                            <img src={q.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            q.user.username[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{q.user.username}</p>
                          {q.listing && (
                            <p className="text-xs text-text-secondary">
                              К листингу: {q.listing.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-surface-secondary rounded-lg p-3 mb-3">
                      <p className="text-sm">{q.question}</p>
                    </div>

                    {q.answer ? (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">Ответ:</span>
                          {q.answeredAt && (
                            <span className="text-xs text-text-secondary">
                              {new Date(q.answeredAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{q.answer}</p>
                      </div>
                    ) : answeringId === q.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Введите ответ..."
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswer(q.id)}
                            disabled={submitting || !answerText.trim()}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
                          >
                            {submitting ? 'Отправка...' : 'Ответить'}
                          </button>
                          <button
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerText('');
                            }}
                            className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-surface-secondary transition-colors text-sm"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnsweringId(q.id)}
                        className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors text-sm"
                      >
                        Ответить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}