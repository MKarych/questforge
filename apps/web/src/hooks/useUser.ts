'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, getProfile, type User } from '@/lib/api/client';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfile();
      setUser(response.data);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [refresh]);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    await apiClient.patch('/users/me', data);
    await refresh();
  }, [refresh]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    await apiClient.post('/users/me/avatar', { avatarUrl });
    await refresh();
  }, [refresh]);

  const deleteAvatar = useCallback(async () => {
    await apiClient.delete('/users/me/avatar');
    await refresh();
  }, [refresh]);

  return {
    user,
    loading,
    error,
    refresh,
    updateProfile,
    updateAvatar,
    deleteAvatar,
    isAuthenticated: !!user,
  };
}