'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getMyActiveRegistrations } from '@/lib/api/client';

interface ActiveRegistration {
  gameId: string;
  gameTitle: string;
  shareLink: string;
  gameStatus: string;
  teamId: string;
  teamName: string;
  sessionId: string | null;
  timer: {
    canStart: boolean;
    timeUntilStart: number;
    startTime: string;
  } | null;
  city: string;
  duration: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  PUBLISHED: { label: 'Ожидает старта', icon: '📅', color: 'text-primary' },
  REGISTRATION_OPEN: { label: 'Регистрация открыта', icon: '📝', color: 'text-success' },
  REGISTRATION_CLOSED: { label: 'Регистрация закрыта', icon: '🔒', color: 'text-info' },
  LOBBY: { label: 'Ожидание старта', icon: '🔄', color: 'text-warning' },
  RUNNING: { label: 'Идёт игра', icon: '🎮', color: 'text-warning' },
};

export default function MyActiveGames() {
  const [registrations, setRegistrations] = useState<ActiveRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const response = await getMyActiveRegistrations();
      if (response.data && Array.isArray(response.data)) {
        setRegistrations(response.data);
      }
    } catch {
      // not logged in
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || registrations.length === 0) {
    return null;
  }

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-3">
          🎮 Мои активные игры
          <span className="text-sm font-normal text-text-secondary bg-surface-elevated px-3 py-1 rounded-full">
            {registrations.length}
          </span>
        </h2>
        <Link href="/games?my=active" className="text-primary hover:text-primary-hover font-medium text-sm">
          Смотреть все →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {registrations.map((reg) => {
          const statusCfg = STATUS_CONFIG[reg.gameStatus] || { label: reg.gameStatus, icon: '🎮', color: 'text-text-secondary' };
          const isRunning = reg.gameStatus === 'RUNNING';
          const linkHref = isRunning && reg.sessionId
            ? `/play/${reg.shareLink}/${reg.sessionId}`
            : `/play/${reg.shareLink}/lobby`;

          return (
            <Link
              key={reg.gameId}
              href={linkHref}
              className="card hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate">
                    {reg.gameTitle}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 truncate">
                    📍 {reg.city} · ⏱ {reg.duration} мин
                  </p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color} bg-background/50 ml-2`}>
                  {statusCfg.icon} {statusCfg.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-text-muted truncate">
                  {reg.teamId ? '👥' : '👤'} {reg.teamName}
                  {reg.timer && !reg.timer.canStart && reg.gameStatus !== 'RUNNING' && (
                    <span className="ml-3 font-mono">
                      ⏳ {formatTime(reg.timer.timeUntilStart)}
                    </span>
                  )}
                  {reg.timer?.canStart && reg.gameStatus !== 'RUNNING' && (
                    <span className="ml-3 text-success font-medium">🚀 Можно стартовать!</span>
                  )}
                </div>
                <span className="shrink-0 text-sm text-primary font-medium group-hover:translate-x-1 transition-transform ml-2">
                  {isRunning ? 'Продолжить →' : 'Перейти в лобби →'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}