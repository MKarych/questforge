'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getPublicGame,
  getMyTeams,
  registerTeam,
  registerTeamByName,
  addReview,
  startGame,
  getGameRegistrations,
  getPublicComments,
  addPublicComment,
  deletePublicComment,
  updatePublicComment,
  type GameDetails,
  type MyTeam,
  type Comment,
} from '@/lib/api/client';
import Header from '@/components/ui/Header';
import ImageModal from '@/components/ui/ImageModal';

const DEFAULT_LOGO = '/images/logo/logo-full-light.svg';

interface GamePageParams {
  [key: string]: string;
  id: string;
}

export default function GameDetailsPage() {
  const params = useParams<GamePageParams>();
  const router = useRouter();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Register by name state
  const [teamName, setTeamName] = useState('');
  const [registeringByName, setRegisteringByName] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Organizer state
  const [registrations, setRegistrations] = useState<Array<{ teamId: string; team: { id: string; name: string; slug: string; avatar: string | null }; status: string; readyAt: string | null; registeredAt: string }>>([]);
  const [startingGame, setStartingGame] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const gameId = params.id;

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const response = await getPublicComments(gameId);
      setComments(response.data?.data || []);
      setCommentsTotal(response.data?.meta?.total || 0);
    } catch {
      // Comments are optional
    } finally {
      setCommentsLoading(false);
    }
  }, [gameId]);

  // Check current user
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId || payload.sub, role: payload.role || 'PLAYER' });
      }
    } catch {
      // Not logged in
    }
  }, []);

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await getPublicGame(gameId);
        setGame(response.data);

        // Fetch user's teams (if logged in)
        try {
          const teamsResponse = await getMyTeams();
          if (teamsResponse.data && Array.isArray(teamsResponse.data)) {
            setMyTeams(teamsResponse.data);
            const lastTeamId = localStorage.getItem('currentTeamId');
            if (lastTeamId && teamsResponse.data.some((t: MyTeam) => t.id === lastTeamId)) {
              setSelectedTeamId(lastTeamId);
            }
          }
        } catch {
          // User not logged in
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить игру');
      } finally {
        setLoading(false);
      }
    }

    loadGame();
    loadComments();
  }, [gameId, loadComments]);

  // Load registrations if user is organizer
  useEffect(() => {
    if (game && currentUser && game.organizer.id === currentUser.id) {
      loadRegistrations();
    }
  }, [game, currentUser]);

  const loadRegistrations = async () => {
    if (!game) return;
    try {
      const response = await getGameRegistrations(game.id);
      setRegistrations(response.data || []);
    } catch {
      // Not available
    }
  };

  const handleRegisterByName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !game) return;

    setRegisteringByName(true);
    setError(null);
    try {
      const response = await registerTeamByName(game.id, teamName.trim());
      setSuccess(`Команда "${response.data.team.name}" зарегистрирована на игру!`);
      setTeamName('');
      // Reload registrations
      loadRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации команды');
    } finally {
      setRegisteringByName(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;

    setSubmittingReview(true);
    setError(null);
    try {
      await addReview(game.id, reviewRating, reviewText.trim() || undefined);
      setReviewSuccess('Отзыв оставлен! Спасибо!');
      setReviewRating(5);
      setReviewText('');
      // Reload game to show new review
      const response = await getPublicGame(game.id);
      setGame(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке отзыва');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartGame = async () => {
    if (!game) return;

    setStartingGame(true);
    setStartError(null);
    try {
      const response = await startGame(game.id);
      setGame((prev) => prev ? { ...prev, status: response.data.status } : prev);
      setSuccess('Игра запущена!');
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Ошибка запуска игры');
    } finally {
      setStartingGame(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !game) return;

    setJoining(true);
    setError(null);
    try {
      const response = await registerTeam(game.id, selectedTeamId);
      localStorage.setItem('currentTeamId', selectedTeamId);
      setSuccess(`Команда "${response.data.team.name}" зарегистрирована на игру!`);
      setTimeout(() => {
        router.push(`/play/${game.shareLink}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться на игру');
      setJoining(false);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await addPublicComment(gameId, newCommentText.trim());
      setComments((prev) => [response.data, ...prev]);
      setCommentsTotal((prev) => prev + 1);
      setNewCommentText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить комментарий');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить комментарий?')) return;

    try {
      await deletePublicComment(gameId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsTotal((prev) => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить комментарий');
    }
  };

  // Start editing comment
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await updatePublicComment(gameId, commentId, editingCommentText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, text: response.data.text } : c)),
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отредактировать комментарий');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // Check if user can delete comment (ADMIN or MODERATOR)
  const canDeleteComment = (comment: Comment) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR') return true;
    return comment.userId === currentUser.id;
  };

  // Check if user can edit comment (only author)
  const canEditComment = (comment: Comment) => {
    if (!currentUser) return false;
    return comment.userId === currentUser.id;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHour < 24) return `${diffHour} ч. назад`;
    if (diffDay < 7) return `${diffDay} дн. назад`;
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-surface rounded-xl mb-6" />
            <div className="h-8 bg-surface rounded mb-4 w-1/2" />
            <div className="h-4 bg-surface rounded mb-2 w-3/4" />
            <div className="h-4 bg-surface rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card border-error text-center py-12">
            <p className="text-error mb-4">{error || 'Game not found'}</p>
            <Link href="/games" className="btn-primary">
              Вернуться к каталогу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Бесплатно' : `${price} ₽`;
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            {game.imageUrl && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="relative w-full h-64 mb-6 rounded-xl overflow-hidden cursor-pointer text-left"
              >
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  quality={85}
                />
              </button>
            )}
            {!game.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-surface-elevated flex items-center justify-center">
                <Image
                  src={DEFAULT_LOGO}
                  alt={game.title}
                  fill
                  className="object-contain p-8"
                  quality={100}
                  unoptimized
                />
              </div>
            )}

            <h1 className="text-3xl font-bold mb-4 text-text-primary">{game.title}</h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="card flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span className="text-text-secondary">{game.city}</span>
              </div>
              <div className="card flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-text-secondary">{game.duration} мин</span>
              </div>
              <div className="card flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-text-secondary">До {game.maxTeams} команд</span>
              </div>
              {game.averageRating > 0 && (
                <div className="card flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-warning font-semibold">{game.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <h2 className="text-xl font-semibold mb-3 text-text-primary">Описание</h2>
              <p className="text-text-secondary">{game.description || 'Описание игры'}</p>
            </div>

            {/* Reviews — только после завершения игры */}
            {game.status === 'FINISHED' && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Отзывы</h2>
                
                {/* Форма добавления отзыва (для участников, не организатора) */}
                {currentUser && game.organizer.id !== currentUser.id && (
                  <form onSubmit={handleAddReview} className="card p-4 mb-6">
                    <h3 className="font-medium text-text-primary mb-3">Оставить отзыв</h3>
                    
                    {reviewSuccess && (
                      <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-3">
                        {reviewSuccess}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="label">Оценка</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl transition-colors ${
                              star <= reviewRating ? 'text-warning' : 'text-text-muted'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="label">Комментарий (необязательно)</label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Поделитесь впечатлениями об игре..."
                        className="input-field min-h-[80px] resize-y"
                        maxLength={2000}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary disabled:opacity-50"
                    >
                      {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
                    </button>
                  </form>
                )}
                
                {/* Список отзывов */}
                {game.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {game.reviews.map((review) => (
                      <div key={review.id} className="card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-text-primary">{review.user.name}</span>
                          <div className="flex items-center gap-1 text-warning">
                            <span>★</span>
                            <span className="font-medium">{review.rating}</span>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-text-secondary text-sm">{review.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-center py-4">
                    Пока нет отзывов. Будьте первым!
                  </p>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-text-primary">
                Обсуждение {commentsTotal > 0 && <span className="text-text-muted">({commentsTotal})</span>}
              </h2>

              {/* Comment form for authorized users */}
              {currentUser ? (
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Напишите комментарий..."
                    className="input-field min-h-[80px] resize-y mb-3"
                    maxLength={2000}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {newCommentText.length}/2000
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment || !newCommentText.trim()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Отправка...' : 'Отправить'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="card p-6 mb-6 text-center">
                  <p className="text-text-secondary mb-4">
                    💬 Чтобы оставить комментарий, войдите в аккаунт.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/auth/login" className="btn-primary">
                      Войти
                    </Link>
                    <Link href="/auth/register" className="btn-secondary">
                      Зарегистрироваться
                    </Link>
                  </div>
                </div>
              )}

              {/* Comments list */}
              {commentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse card p-4">
                      <div className="h-4 bg-surface rounded w-1/4 mb-2" />
                      <div className="h-3 bg-surface rounded w-3/4 mb-2" />
                      <div className="h-3 bg-surface rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-text-muted text-center py-8">
                  Пока нет комментариев. Будьте первым!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-text-primary text-sm">
                              {comment.user.name}
                            </span>
                            <span className="text-text-muted text-xs ml-2">
                              {formatCommentDate(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          {canEditComment(comment) && editingCommentId !== comment.id && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="p-1 text-text-muted hover:text-primary transition-colors"
                              title="Редактировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDeleteComment(comment) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-text-muted hover:text-error transition-colors"
                              title="Удалить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Edit mode */}
                      {editingCommentId === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="input-field min-h-[60px] resize-y mb-2"
                            maxLength={2000}
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editingCommentText.trim()}
                              className="btn-primary text-sm disabled:opacity-50"
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="btn-secondary text-sm"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-text-secondary text-sm mt-1 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatPrice(game.price)}
                </div>
                <p className="text-text-secondary text-sm">с участника</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{formatDate(game.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm">{game.organizer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-lg">📋</span>
                  <span className="text-sm">{game.status === 'REGISTRATION_OPEN' || game.status === 'PUBLISHED' ? 'Регистрация открыта' : game.status === 'RUNNING' ? 'Идёт игра' : game.status === 'FINISHED' ? 'Завершена' : game.status === 'LOBBY' ? 'Ожидание старта' : game.status}</span>
                </div>
              </div>

              {/* Блок организатора */}
              {currentUser && game.organizer.id === currentUser.id && (
                <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <h3 className="font-medium text-text-primary text-sm mb-2">👑 Панель организатора</h3>
                  
                  {/* Список зарегистрированных команд */}
                  {registrations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-text-secondary mb-1">Команды ({registrations.length}):</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {registrations.map((reg) => (
                          <div key={reg.teamId} className="flex items-center justify-between text-xs p-1.5 rounded bg-surface">
                            <span className="text-text-primary truncate">{reg.team.name}</span>
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                              reg.status === 'READY' ? 'bg-success/20 text-success' : 'bg-text-muted/20 text-text-muted'
                            }`}>
                              {reg.status === 'READY' ? 'Готовы' : 'Ожидание'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Кнопка запуска игры */}
                  {(game.status === 'LOBBY' || game.status === 'REGISTRATION_OPEN' || game.status === 'REGISTRATION_CLOSED' || game.status === 'PUBLISHED') && (
                    <div>
                      {startError && (
                        <div className="p-2 rounded bg-error/10 text-error text-xs mb-2">
                          {startError}
                        </div>
                      )}
                      <button
                        onClick={handleStartGame}
                        disabled={startingGame || registrations.length === 0}
                        className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={registrations.length === 0 ? 'Нужна хотя бы одна команда' : 'Запустить игру'}
                      >
                        {startingGame ? 'Запуск...' : registrations.length === 0 ? 'Нет команд для старта' : '🚀 Запустить игру'}
                      </button>
                    </div>
                  )}
                  
                  {game.status === 'RUNNING' && (
                    <p className="text-xs text-success text-center">✅ Игра запущена</p>
                  )}
                  {game.status === 'FINISHED' && (
                    <p className="text-xs text-text-muted text-center">📊 Игра завершена</p>
                  )}
                </div>
              )}

              {/* Регистрация команды — для игроков, не организаторов */}
              {!currentUser || game.organizer.id !== currentUser.id ? (
                <>
                  {success ? (
                    <div className="text-center">
                      <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-3">
                        {success}
                      </div>
                      <p className="text-text-secondary text-xs">
                        Перенаправление в лобби...
                      </p>
                    </div>
                  ) : game.isRegistered && ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY'].includes(game.status) ? (
                    <div className="text-center">
                      <p className="text-text-secondary text-sm mb-3">Ваша команда уже зарегистрирована</p>
                      <Link
                        href={`/play/${game.shareLink}`}
                        className="btn-primary w-full inline-block"
                      >
                        🚪 Перейти в лобби
                      </Link>
                    </div>
                  ) : (game.status === 'REGISTRATION_OPEN' || game.status === 'PUBLISHED') ? (
                    <div className="space-y-4">
                      {/* Регистрация через существующую команду */}
                      {myTeams.length > 0 && (
                        <form onSubmit={handleRegister} className="space-y-3">
                          <div>
                            <label className="label">Выберите команду</label>
                            <select
                              value={selectedTeamId}
                              onChange={(e) => setSelectedTeamId(e.target.value)}
                              className="input-field"
                              required
                            >
                              <option value="">-- Выберите команду --</option>
                              {myTeams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name} {team.myRole === 'captain' ? '👑' : ''} ({team.membersCount} уч.)
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            disabled={joining || !selectedTeamId}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {joining ? 'Регистрация...' : 'Зарегистрироваться'}
                          </button>
                        </form>
                      )}

                      {/* Регистрация новой команды по названию */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-surface" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-2 text-text-muted">или</span>
                        </div>
                      </div>

                      <form onSubmit={handleRegisterByName} className="space-y-3">
                        <div>
                          <label className="label">Название команды</label>
                          <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Введите название команды"
                            className="input-field"
                            maxLength={100}
                            required
                          />
                        </div>

                        {error && (
                          <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={registeringByName || !teamName.trim()}
                          className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {registeringByName ? 'Регистрация...' : 'Зарегистрировать команду'}
                        </button>
                      </form>
                    </div>
                  ) : game.status === 'RUNNING' ? (
                    <div className="text-center">
                      <p className="text-text-secondary text-sm mb-3">Игра уже началась!</p>
                      <Link
                        href={`/play/${game.shareLink}`}
                        className="btn-primary w-full inline-block"
                      >
                        🎮 Перейти к игре
                      </Link>
                    </div>
                  ) : game.status === 'FINISHED' ? (
                    <div className="text-center">
                      <p className="text-text-secondary text-sm">Игра завершена</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-text-secondary text-sm">
                        {game.status === 'LOBBY' ? 'Ожидание старта...' : 'Регистрация скоро откроется'}
                      </p>
                    </div>
                  )}
                </>
              ) : null}

              <p className="text-xs text-text-muted text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с правилами игры
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && game?.imageUrl && (
        <ImageModal
          src={game.imageUrl}
          alt={game.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
