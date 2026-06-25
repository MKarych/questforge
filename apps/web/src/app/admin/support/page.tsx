'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await apiClient.updateSupportTicket(ticketId, { status: newStatus });
      const ticketsRes = await apiClient.getSupportTickets({ status: statusFilter || undefined, limit: 50 });
      setTickets(ticketsRes.data.items);
      const statsRes = await apiClient.getSupportStats();
      setStats(statsRes.data);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Ошибка обновления тикета:', err);
    }
  };

  const handleRespond = async (ticketId: string) => {
    if (!responseText.trim()) return;
    try {
      await apiClient.updateSupportTicket(ticketId, {
        status: 'CLOSED',
        response: responseText,
      });
      setResponseText('');
      const ticketsRes = await apiClient.getSupportTickets({ status: statusFilter || undefined, limit: 50 });
      setTickets(ticketsRes.data.items);
      const statsRes = await apiClient.getSupportStats();
      setStats(statsRes.data);
      setSelectedTicket(null);
    } catch (err) {
      console.error('Ошибка ответа на тикет:', err);
    }
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            📊 Дашборд
          </Link>
          <Link
            href="/admin/games/pending"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            🎮 Модерация игр
          </Link>
          <Link
            href="/admin/organizers/applications"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            📋 Заявки организаторов
          </Link>
          <Link
            href="/admin/support"
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium"
          >
            📬 Поддержка
          </Link>
          {userRole === 'ADMIN' && (
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
            >
              👥 Пользователи
            </Link>
          )}
          <Link
            href="/admin/teams"
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:bg-surface-hover font-medium"
          >
            👥 Команды
          </Link>
        </div>

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

        {/* Tickets List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets Table */}
          <div className="lg:col-span-1 space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-text-secondary">Нет заявок</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setResponseText('');
                  }}
                  className={`w-full text-left card p-4 hover:shadow-md transition-all ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-medium text-text-primary text-sm truncate">
                      {ticket.name}
                    </span>
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
                  </p>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {ticket.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                    <span>{ticket.email}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-1">
            {selectedTicket ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">
                    Заявка #{selectedTicket.id.slice(0, 8)}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[selectedTicket.status]
                    }`}
                  >
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div>
                    <span className="text-text-muted">От:</span>{' '}
                    <span className="text-text-primary">{selectedTicket.name}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Email:</span>{' '}
                    <span className="text-text-primary">{selectedTicket.email}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Категория:</span>{' '}
                    <span className="text-text-primary">
                      {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Создана:</span>{' '}
                    <span className="text-text-primary">
                      {new Date(selectedTicket.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  {selectedTicket.assignee && (
                    <div>
                      <span className="text-text-muted">В работе у:</span>{' '}
                      <span className="text-text-primary">{selectedTicket.assignee.name}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Сообщение:</h4>
                  <div className="p-4 bg-surface-elevated rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                </div>

                {selectedTicket.response && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-text-primary mb-2">Ответ:</h4>
                    <div className="p-4 bg-primary/5 rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap border border-primary/10">
                      {selectedTicket.response}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
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
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Введите ответ пользователю..."
                        rows={4}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(selectedTicket.id)}
                          disabled={!responseText.trim()}
                          className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Ответить и закрыть
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
            ) : (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-4">📩</div>
                <p className="text-text-secondary">Выберите заявку из списка</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}