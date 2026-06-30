'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

interface SupportTicket {
  id: string;
  email: string;
  name: string;
  category: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'CLOSED';
  response: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
}

interface SupportStats {
  new: number;
  inProgress: number;
  closed: number;
  total: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Общий вопрос',
  game: 'Проблема с игрой',
  account: 'Аккаунт и регистрация',
  payment: 'Оплата и подписки',
  technical: 'Техническая проблема',
  organizer: 'Для организаторов',
  other: 'Другое',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Закрыта',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CLOSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function AdminSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const profileResponse = await getProfile();
        const role = profileResponse.data.role;
        setUserRole(role);

        if (role !== 'ADMIN' && role !== 'MODERATOR') {
          router.push('/');
          return;
        }

        const [ticketsRes, statsRes] = await Promise.all([
          apiClient.getSupportTickets({ limit: 50 }),
          apiClient.getSupportStats(),
        ]);

        setTickets(ticketsRes.data.items);
        setStats(statsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const refreshData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        apiClient.getSupportTickets({ status: statusFilter || undefined, limit: 50 }),
        apiClient.getSupportStats(),
      ]);
      setTickets(ticketsRes.data.items);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await apiClient.updateSupportTicket(ticketId, { status: newStatus });
      await refreshData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Ошибка обновления тикета:', err);
    }
  };

  const handleRespond = async (ticketId: string) => {
    if (!responseText.trim()) return;
    setResponding(true);
    try {
      await apiClient.updateSupportTicket(ticketId, {
        status: 'CLOSED',
        response: responseText,
      });
      setResponseText('');
      setSelectedTicket(null);
      await refreshData();
    } catch (err) {
      console.error('Ошибка ответа на тикет:', err);
    } finally {
      setResponding(false);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText('');
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setResponseText('');
  };

  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.status === statusFilter)
    : tickets;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error}</p>
            <Link href="/" className="btn-primary">На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">📬 Заявки в поддержку</h1>
          <span className="text-sm text-text-secondary">
            {userRole === 'ADMIN' ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        <AdminNav userRole={userRole} />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="text-3xl font-bold text-blue-500 mb-1">{stats.new}</div>
              <div className="text-sm text-text-secondary">Новых</div>
            </div>
            <div className="card">
              <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.inProgress}</div>
              <div className="text-sm text-text-secondary">В работе</div>
            </div>
            <div className="card">
              <div className="text-3xl font-bold text-green-500 mb-1">{stats.closed}</div>
              <div className="text-sm text-text-secondary">Закрыто</div>
            </div>
            <div className="card">
              <div className="text-3xl font-bold text-text-primary mb-1">{stats.total}</div>
              <div className="text-sm text-text-secondary">Всего</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              !statusFilter
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated border border-border'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setStatusFilter('NEW')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'NEW'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated border border-border'
            }`}
          >
            Новые
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated border border-border'
            }`}
          >
            В работе
          </button>
          <button
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'CLOSED'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated border border-border'
            }`}
          >
            Закрытые
          </button>
        </div>

        {/* Tickets List — full width */}
        {filteredTickets.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-text-secondary">Нет заявок</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className="w-full text-left card p-4 hover:shadow-md transition-all hover:ring-1 hover:ring-primary/30"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-text-primary text-sm truncate">
                      {ticket.name}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      ({ticket.email})
                    </span>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[ticket.status]
                    }`}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-1.5">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                  {' · '}
                  {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {ticket.message}
                </p>
                {ticket.response && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <span>✅</span>
                    <span>Ответ дан</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Заявка #{selectedTicket.id.slice(0, 8)}
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[selectedTicket.status]
                  }`}
                >
                  {STATUS_LABELS[selectedTicket.status]}
                </span>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-surface-elevated rounded-xl">
                  <div className="text-text-muted text-xs mb-0.5">От</div>
                  <div className="text-text-primary font-medium">{selectedTicket.name}</div>
                </div>
                <div className="p-3 bg-surface-elevated rounded-xl">
                  <div className="text-text-muted text-xs mb-0.5">Email</div>
                  <div className="text-text-primary font-medium break-all">{selectedTicket.email}</div>
                </div>
                <div className="p-3 bg-surface-elevated rounded-xl">
                  <div className="text-text-muted text-xs mb-0.5">Создана</div>
                  <div className="text-text-primary">
                    {new Date(selectedTicket.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>
                {selectedTicket.assignee && (
                  <div className="p-3 bg-surface-elevated rounded-xl">
                    <div className="text-text-muted text-xs mb-0.5">В работе у</div>
                    <div className="text-text-primary font-medium">{selectedTicket.assignee.name}</div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-2">Сообщение:</h4>
                <div className="p-4 bg-surface-elevated rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Previous Response */}
              {selectedTicket.response && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">Ответ:</h4>
                  <div className="p-4 bg-primary/5 rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap border border-primary/10">
                    {selectedTicket.response}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2 border-t border-border">
                {selectedTicket.status === 'NEW' && (
                  <button
                    onClick={() => handleStatusChange(selectedTicket.id, 'IN_PROGRESS')}
                    className="w-full px-4 py-2.5 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Взять в работу
                  </button>
                )}

                {selectedTicket.status === 'IN_PROGRESS' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Ответ пользователю
                      </label>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Введите ответ пользователю... (пока тестово, email-отправка не реализована)"
                        rows={4}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-y"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(selectedTicket.id)}
                        disabled={!responseText.trim() || responding}
                        className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {responding ? 'Отправка...' : 'Ответить и закрыть'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, 'CLOSED')}
                        className="px-4 py-2.5 bg-surface-elevated text-text-secondary rounded-xl font-medium hover:bg-border transition-colors text-sm"
                      >
                        Закрыть без ответа
                      </button>
                    </div>
                  </>
                )}

                {selectedTicket.status === 'CLOSED' && (
                  <button
                    onClick={() => handleStatusChange(selectedTicket.id, 'NEW')}
                    className="w-full px-4 py-2.5 bg-surface-elevated text-text-secondary rounded-xl font-medium hover:bg-border transition-colors text-sm"
                  >
                    Открыть заново
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}