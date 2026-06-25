'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

interface Application {
  id: string;
  userId: string;
  status: string;
  city: string;
  phone: string;
  telegram: string;
  experience: string;
  createdAt: string;
  rejectionReason: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    gamesCreated: number;
    scenariosCreated: number;
  };
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ appId: string; userName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

        const response = await apiClient.getPendingApplications();
        setApplications(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleApprove = async (appId: string) => {
    setActionLoading(appId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.approveApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      setSuccess('Заявка одобрена! Пользователь теперь ORGANIZER.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOpen = (appId: string, userName: string) => {
    setRejectModal({ appId, userName });
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectReason.trim()) return;

    setActionLoading(rejectModal.appId);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.rejectApplication(rejectModal.appId, rejectReason.trim());
      setApplications((prev) => prev.filter((a) => a.id !== rejectModal.appId));
      setSuccess('Заявка отклонена');
      setRejectModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCancel = () => {
    setRejectModal(null);
    setRejectReason('');
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <AdminNav userRole={userRole} />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">📋 Заявки организаторов</h1>
            <p className="text-text-secondary mt-1">
              {applications.length > 0
                ? `${applications.length} заяв${applications.length === 1 ? 'ка' : 'ки'} ожидает рассмотрения`
                : 'Нет заявок на рассмотрении'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">{error}</div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-4">{success}</div>
        )}

        {applications.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Все заявки рассмотрены</h2>
            <p className="text-text-secondary">Нет новых заявок на роль организатора</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {app.user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{app.user.name}</h3>
                        <p className="text-sm text-text-secondary">{app.user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                      <div>
                        <span className="text-text-muted">Город:</span>
                        <span className="text-text-primary ml-1">{app.city || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Телефон:</span>
                        <span className="text-text-primary ml-1">{app.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Telegram:</span>
                        <span className="text-text-primary ml-1">{app.telegram || '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Игр создано:</span>
                        <span className="text-text-primary ml-1">{app.user.gamesCreated}</span>
                      </div>
                    </div>
                    {app.experience && (
                      <div className="mt-2 text-sm">
                        <span className="text-text-muted">Опыт:</span>
                        <p className="text-text-secondary mt-1">{app.experience}</p>
                      </div>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      Подана: {new Date(app.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 items-start md:items-stretch">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={actionLoading === app.id}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {actionLoading === app.id ? '...' : '✅ Одобрить'}
                    </button>
                    <button
                      onClick={() => handleRejectOpen(app.id, app.user.name)}
                      disabled={actionLoading === app.id}
                      className="px-4 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 text-sm font-medium disabled:opacity-50"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Отклонить заявку</h3>
            <p className="text-text-secondary text-sm mb-4">
              Пользователь: <strong>{rejectModal.userName}</strong>
            </p>
            <div className="mb-4">
              <label className="label">Причина отклонения *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Укажите причину отклонения..."
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleRejectCancel} className="btn-secondary text-sm">
                Отмена
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.appId}
                className="px-4 py-2 rounded-lg bg-error text-white hover:bg-error/90 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading === rejectModal.appId ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}