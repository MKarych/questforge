'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminComplaints, getProfile } from '@/lib/api/client';
import type { ComplaintDto, ComplaintListResponse } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Принята',
  REJECTED: 'Отклонена',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  APPROVED: 'bg-green-500/10 text-green-500 border-green-500/30',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  GAME: 'Игра',
  SCENARIO: 'Сценарий',
  COMMENT: 'Комментарий',
  REVIEW: 'Отзыв',
  MARKETPLACE_REVIEW: 'Отзыв в маркетплейсе',
  USER: 'Пользователь',
  TEAM: 'Команда',
  CHAT_MESSAGE: 'Сообщение',
};

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Спам',
  ABUSE: 'Оскорбления',
  NSFW: 'Неприемлемый контент',
  COPYRIGHT: 'Нарушение авторских прав',
  FRAUD: 'Мошенничество',
  HARASSMENT: 'Преследование',
  IMPERSONATION: 'Выдача себя за другого',
  FALSE_INFO: 'Недостоверная информация',
  OTHER: 'Другое',
};

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [data, setData] = useState<ComplaintListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const limit = 20;

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

        await fetchComplaints();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, statusFilter, targetTypeFilter, page]);

  const fetchComplaints = async () => {
    try {
      const params: Record<string, any> = { limit, offset: page * limit };
      if (statusFilter) params.status = statusFilter;
      if (targetTypeFilter) params.targetType = targetTypeFilter;

      const response = await getAdminComplaints(params);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

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

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error || 'Нет данных'}</p>
            <Link href="/" className="btn-primary">На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">🚨 Жалобы</h1>
          <span className="text-sm text-text-secondary">
            {userRole === 'ADMIN' ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        <AdminNav userRole={userRole} />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Все статусы</option>
            <option value="PENDING">На рассмотрении</option>
            <option value="APPROVED">Принятые</option>
            <option value="REJECTED">Отклонённые</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Все типы</option>
            {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <span className="text-sm text-text-secondary self-center">
            Всего: {data.total}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Дата</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Тип</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Причина</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Отправитель</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Статус</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Модератор</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-secondary">
                    Нет жалоб
                  </td>
                </tr>
              ) : (
                data.items.map((complaint: ComplaintDto) => (
                  <tr key={complaint.id} className="border-b border-border-primary hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {new Date(complaint.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {TARGET_TYPE_LABELS[complaint.targetType] || complaint.targetType}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {REASON_LABELS[complaint.reason] || complaint.reason}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {complaint.reporterName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[complaint.status] || ''}`}>
                        {STATUS_LABELS[complaint.status] || complaint.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {complaint.moderatedByName || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/complaints/${complaint.id}`}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Подробнее →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              ← Назад
            </button>
            <span className="px-3 py-1 text-text-secondary">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Вперед →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}