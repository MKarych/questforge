'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { apiClient, uploadAvatar } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import AvatarUpload from '@/components/ui/AvatarUpload';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface FormData {
  username: string;
  city: string;
  bio: string;
  tg: string;
  vk: string;
  discord: string;
  youtube: string;
  github: string;
  language: 'ru' | 'en';
  timezone: string;
  theme: 'dark' | 'light';
  notifications: {
    email: boolean;
    telegram: boolean;
    push: boolean;
  };
  privacy: {
    showCity: 'everyone' | 'friends' | 'nobody';
    showContacts: 'everyone' | 'friends' | 'nobody';
    showStats: 'everyone' | 'friends' | 'nobody';
    showAchievements: 'everyone' | 'friends' | 'nobody';
  };
}

const TIMEZONES = [
  'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara',
  'Europe/Volgograd', 'Asia/Yekaterinburg', 'Asia/Omsk',
  'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Vladivostok',
  'Asia/Kamchatka', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai',
];

const PRIVACY_OPTIONS: { value: 'everyone' | 'friends' | 'nobody'; label: string }[] = [
  { value: 'everyone', label: 'Все' },
  { value: 'friends', label: 'Друзья' },
  { value: 'nobody', label: 'Никто' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading, refresh, deleteAvatar } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<FormData>({
    username: '',
    city: '',
    bio: '',
    tg: '',
    vk: '',
    discord: '',
    youtube: '',
    github: '',
    language: 'ru',
    timezone: 'Europe/Moscow',
    theme: 'dark',
    notifications: { email: true, telegram: false, push: true },
    privacy: {
      showCity: 'everyone',
      showContacts: 'friends',
      showStats: 'everyone',
      showAchievements: 'everyone',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        city: user.city || '',
        bio: user.bio || '',
        tg: user.socialLinks?.tg || '',
        vk: user.socialLinks?.vk || '',
        discord: user.socialLinks?.discord || '',
        youtube: user.socialLinks?.youtube || '',
        github: user.socialLinks?.github || '',
        language: (user as any).language || 'ru',
        timezone: (user as any).timezone || 'Europe/Moscow',
        theme: (user as any).theme || 'dark',
        notifications: (user as any).notificationSettings || { email: true, telegram: false, push: true },
        privacy: (user as any).privacySettings || {
          showCity: 'everyone', showContacts: 'friends',
          showStats: 'everyone', showAchievements: 'everyone',
        },
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      // Handle nested notification fields
      if (name.startsWith('notif.')) {
        const key = name.split('.')[1];
        setForm(prev => ({
          ...prev,
          notifications: { ...prev.notifications, [key]: checked },
        }));
      } else {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePrivacyChange = (field: keyof FormData['privacy'], value: 'everyone' | 'friends' | 'nobody') => {
    setForm(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value },
    }));
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      // Используем uploadAvatar из client.ts — он шлёт напрямую на localhost:3000,
      // минуя Next.js rewrite (который ломает multipart/form-data)
      await uploadAvatar(file);
      // UploadController сам вызвал usersService.updateAvatar(),
      // но нам нужно обновить состояние пользователя через хук
      await refresh();
      setMessage({ type: 'success', text: 'Аватар обновлён' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки аватара';
      setMessage({ type: 'error', text: msg });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar();
      setMessage({ type: 'success', text: 'Аватар удалён' });
    } catch {
      setMessage({ type: 'error', text: 'Ошибка удаления аватара' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await apiClient.patch('/users/me', {
        username: form.username,
        city: form.city,
        bio: form.bio,
        socialLinks: {
          tg: form.tg || undefined,
          vk: form.vk || undefined,
          discord: form.discord || undefined,
          youtube: form.youtube || undefined,
          github: form.github || undefined,
        },
        language: form.language,
        timezone: form.timezone,
        theme: form.theme,
        notificationSettings: form.notifications,
        privacySettings: form.privacy,
      });

      await refresh();
      setMessage({ type: 'success', text: 'Профиль успешно обновлён!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ошибка обновления',
      });
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

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Настройки профиля</h1>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-error/10 text-error'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ===== АВАТАР ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Фото профиля</h2>
              <AvatarUpload
                currentAvatar={user?.avatarUrl || user?.avatar || null}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
                uploading={avatarUploading}
              />
            </div>

            {/* ===== ОСНОВНАЯ ИНФОРМАЦИЯ ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Основная информация</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Имя пользователя</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="input-field"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="label">Город</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Москва"
                    className="input-field"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="label">О себе</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Расскажите о себе..."
                    className="input-field min-h-[100px]"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-text-secondary mt-1">{form.bio.length}/500</p>
                </div>
              </div>
            </div>

            {/* ===== КОНТАКТЫ ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Контакты</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Telegram</label>
                  <input
                    type="text" name="tg" value={form.tg}
                    onChange={handleChange} placeholder="@username"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">VK</label>
                  <input
                    type="url" name="vk" value={form.vk}
                    onChange={handleChange} placeholder="https://vk.com/username"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Discord</label>
                  <input
                    type="text" name="discord" value={form.discord}
                    onChange={handleChange} placeholder="username#0000"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">YouTube</label>
                  <input
                    type="url" name="youtube" value={form.youtube}
                    onChange={handleChange} placeholder="https://youtube.com/@channel"
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">GitHub</label>
                  <input
                    type="url" name="github" value={form.github}
                    onChange={handleChange} placeholder="https://github.com/username"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* ===== НАСТРОЙКИ ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Настройки</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Язык</label>
                  <select name="language" value={form.language} onChange={handleChange} className="input-field">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="label">Часовой пояс</label>
                  <select name="timezone" value={form.timezone} onChange={handleChange} className="input-field">
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Тема</label>
                  <select name="theme" value={form.theme} onChange={handleChange} className="input-field">
                    <option value="dark">Тёмная</option>
                    <option value="light">Светлая</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ===== УВЕДОМЛЕНИЯ ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Уведомления</h2>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email-уведомления' },
                  { key: 'telegram', label: 'Уведомления в Telegram' },
                  { key: 'push', label: 'Push-уведомления' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`notif.${key}`}
                      checked={(form.notifications as any)[key]}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-surface-elevated bg-surface text-primary focus:ring-primary"
                    />
                    <span className="text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ===== ПРИВАТНОСТЬ ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Приватность</h2>
              <div className="space-y-4">
                {([
                  { field: 'showCity' as const, label: 'Кто видит мой город' },
                  { field: 'showContacts' as const, label: 'Кто видит мои контакты' },
                  { field: 'showStats' as const, label: 'Кто видит мою статистику' },
                  { field: 'showAchievements' as const, label: 'Кто видит мои достижения' },
                ]).map(({ field, label }) => (
                  <div key={field}>
                    <label className="label mb-2">{label}</label>
                    <div className="flex gap-2">
                      {PRIVACY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handlePrivacyChange(field, opt.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            form.privacy[field] === opt.value
                              ? 'bg-primary text-white'
                              : 'bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== СТАТИСТИКА ===== */}
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Статистика</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{user?.stats?.gamesPlayed || 0}</div>
                  <div className="text-sm text-text-secondary">Игр пройдено</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{user?.gamesCreated || 0}</div>
                  <div className="text-sm text-text-secondary">Игр создано</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{user?.scenariosCreated || 0}</div>
                  <div className="text-sm text-text-secondary">Сценариев</div>
                </div>
              </div>
            </div>

            {/* ===== SUBMIT ===== */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
