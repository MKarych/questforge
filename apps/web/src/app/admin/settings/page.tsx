'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminNav from '@/components/admin/AdminNav';

const STORAGE_KEY_SOUND = 'admin_notifications_sound';
const STORAGE_KEY_TOASTS = 'admin_notifications_toasts';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastsEnabled, setToastsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

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

        // Загружаем настройки из localStorage
        setSoundEnabled(localStorage.getItem(STORAGE_KEY_SOUND) !== 'false');
        setToastsEnabled(localStorage.getItem(STORAGE_KEY_TOASTS) !== 'false');
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(STORAGE_KEY_SOUND, String(newValue));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToastsToggle = () => {
    const newValue = !toastsEnabled;
    setToastsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY_TOASTS, String(newValue));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore
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

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">⚙️ Настройки уведомлений</h1>
          <span className="text-sm text-text-secondary">
            {userRole === 'ADMIN' ? 'Администратор' : 'Модератор'}
          </span>
        </div>

        <AdminNav userRole={userRole} />

        {saved && (
          <div className="p-3 rounded-lg bg-success/10 text-success text-sm mb-4 animate-fade-in">
            ✅ Настройки сохранены
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          {/* Звуковые уведомления */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">🔊 Звуковые уведомления</h3>
                <p className="text-sm text-text-secondary">
                  Воспроизводить звуковой сигнал при появлении новых заявок, жалоб или тикетов поддержки
                </p>
              </div>
              <button
                onClick={handleSoundToggle}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  soundEnabled ? 'bg-primary' : 'bg-border'
                }`}
                aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleTestSound}
              className="mt-4 px-4 py-2 text-sm font-medium bg-surface-elevated text-text-secondary hover:text-text-primary rounded-lg hover:bg-border transition-colors"
            >
              🔔 Тестовый звук
            </button>
          </div>

          {/* Всплывающие баннеры */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">🪟 Всплывающие баннеры</h3>
                <p className="text-sm text-text-secondary">
                  Показывать всплывающие уведомления в правом нижнем углу при новых событиях
                </p>
              </div>
              <button
                onClick={handleToastsToggle}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  toastsEnabled ? 'bg-primary' : 'bg-border'
                }`}
                aria-label={toastsEnabled ? 'Выключить баннеры' : 'Включить баннеры'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    toastsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Информация */}
          <div className="card p-6 bg-primary/5 border border-primary/10">
            <h3 className="text-sm font-semibold text-text-primary mb-2">ℹ️ Как это работает</h3>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>• Уведомления проверяются каждые 30 секунд</li>
              <li>• Красная точка на кнопке &laquo;Администрирование&raquo; показывает, что есть новые события</li>
              <li>• В выпадающем списке отображается количество новых событий рядом с каждым пунктом</li>
              <li>• Настройки сохраняются в вашем браузере</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}