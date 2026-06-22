'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, type User } from '@/lib/api/client';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    telegram: '',
    vk: '',
    whatsapp: '',
    avatarUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getProfile();
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          city: response.data.city || '',
          bio: response.data.bio || '',
          telegram: response.data.telegram || '',
          vk: response.data.vk || '',
          whatsapp: response.data.whatsapp || '',
          avatarUrl: response.data.avatarUrl || '',
        });
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      // Update profile
      const profileData = {
        name: formData.name,
        city: formData.city,
        bio: formData.bio,
        telegram: formData.telegram,
        vk: formData.vk,
        whatsapp: formData.whatsapp,
      };

      const profileResponse = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!profileResponse.ok) {
        throw new Error('Ошибка обновления профиля');
      }

      // Update avatar if provided
      if (formData.avatarUrl) {
        const avatarResponse = await fetch(`${API_URL}/users/me/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: formData.avatarUrl }),
        });

        if (!avatarResponse.ok) {
          throw new Error('Ошибка обновления аватара');
        }
      }

      setMessage({ type: 'success', text: 'Профиль успешно обновлён!' });
      
      // Reload user data
      const updatedUser = await getProfile();
      setUser(updatedUser.data);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-6">Редактирование профиля</h1>

            {message && (
              <div
                className={`p-3 rounded-lg mb-4 ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-error/10 text-error'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar URL */}
              <div>
                <label className="label">URL аватара</label>
                <div className="flex gap-4">
                  <input
                    type="url"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="input-field flex-1"
                  />
                  {formData.avatarUrl && (
                    <div className="w-16 h-16 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Вставьте ссылку на изображение
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="label">Имя</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              {/* City */}
              <div>
                <label className="label">Город</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Москва"
                  className="input-field"
                  maxLength={100}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="label">О себе</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Расскажите о себе..."
                  className="input-field min-h-[100px]"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-text-secondary mt-1">
                  {formData.bio.length}/1000 символов
                </p>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Telegram</label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    placeholder="@username"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">WhatsApp</label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+7 (999) 000-00-00"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">VK</label>
                <input
                  type="url"
                  name="vk"
                  value={formData.vk}
                  onChange={handleChange}
                  placeholder="https://vk.com/username"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          </div>

          <div className="mt-6 card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Статистика</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {(user as any).gamesPlayed || 0}
                </div>
                <div className="text-sm text-text-secondary">Игр пройдено</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {(user as any).gamesCreated || 0}
                </div>
                <div className="text-sm text-text-secondary">Игр создано</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {(user as any).scenariosCreated || 0}
                </div>
                <div className="text-sm text-text-secondary">Сценариев</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
