'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminComplaintDetail,
  approveComplaint,
  rejectComplaint,
  getProfile,
} from '@/lib/api/client';
import type { ComplaintDto } from '@/lib/api/client';
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
  NSFW: 'Неприемлемый контент (18+)',
  COPYRIGHT: 'Нарушение авторских прав',
  FRAUD: 'Мошенничество',
  HARASSMENT: 'Преследование',
  IMPERSONATION: 'Выдача себя за другого',
  FALSE_INFO: 'Недостоверная информация',
  OTHER: 'Другое',
};

export default function AdminComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [action, setAction] = useState<'soft' | 'hard'>('soft');
  const [moderationNote, setModerationNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

        const response = await getAdminComplaintDetail(id);
        setComplaint(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  const handleApprove = async () => {
    if (!complaint || complaint.status !== 'PENDING') return;
    setSubmitting(true);
    try {
      const response = await approveComplaint(id, {
        action,
        moderationNote: moderationNote.trim() || undefined,
      });
      setComplaint(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!complaint || complaint.status !== 'PENDING') return;
    setSubmitting(true);
    try {
      const response = await rejectComplaint(id, moderationNote.trim() || undefined);
      setComplaint(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка');
    } finally {
      setSubmitting(false);
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

  if (error || !complaint) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <p className="text-error mb-4">{error || 'Жалоба не найдена'}</p>
            <Link href="/admin/complaints" className="btn-primary">← Назад к жалобам</Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = complaint.status === 'PENDING';

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/complaints" className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← Назад к жалобам
          </Link>
        </div>

        <AdminNav userRole={userRole} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary">Детали жалобы</h2>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[complaint.status]}`}>
                  {STATUS_LABELS[complaint.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Тип объекта</p>
                  <p className="text-text-primary font-medium">{TARGET_TYPE_LABELS[complaint.targetType] || complaint.targetType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">ID объекта</p>
                  <p className="text-text-primary font-mono text-sm break-all">{complaint.targetId}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Причина</p>
                  <p className="text-text-primary font-medium">{REASON_LABELS[complaint.reason] || complaint.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Отправитель</p>
                  <p className="text-text-primary font-medium">{complaint.reporterName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Дата</p>
                  <p className="text-text-primary">{new Date(complaint.createdAt).toLocaleString('ru-RU')}</p>
                </div>
                {complaint.moderatedByName && (
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Модератор</p>
                    <p className="text-text-primary">{complaint.moderatedByName}</p>
                  </div>
                )}
              </div>

              {complaint.description && (
                <div>
                  <p className="text-sm text-text-secondary mb-2">Описание</p>
                  <div className="p-4 bg-surface-elevated rounded-lg text-text-primary whitespace-pre-wrap">
                    {complaint.description}
                  </div>
                </div>
              )}
            </div>

            {/* Target info */}
            {(complaint as any).targetInfo && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Информация об объекте</h3>
                <pre className="text-sm text-text-secondary bg-surface-elevated p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify((complaint as any).targetInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Moderation panel */}
          <div className="space-y-6">
            {isPending ? (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Модерация</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Действие при блокировке</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as 'soft' | 'hard')}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="soft">Soft — скрыть контент</option>
                    <option value="hard">Hard — удалить контент</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Комментарий модератора</label>
                  <textarea
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder="Опционально..."
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-y"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="w-full px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Обработка...' : '✅ Принять жалобу'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting}
                    className="w-full px-4 py-2 bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Обработка...' : '❌ Отклонить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Результат модерации</h3>
                <p className="text-text-secondary">
                  Жалоба {complaint.status === 'APPROVED' ? 'принята' : 'отклонена'}
                  {complaint.moderatedAt && ` ${new Date(complaint.moderatedAt).toLocaleString('ru-RU')}`}
                </p>
                {complaint.moderationNote && (
                  <div className="mt-3 p-3 bg-surface-elevated rounded-lg text-sm text-text-primary">
                    {complaint.moderationNote}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}