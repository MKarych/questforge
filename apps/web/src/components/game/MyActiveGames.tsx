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
    <section className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
          🎮 Мои активные игры
          <span className="text-sm font-normal text-text-secondary bg-surface-elevated px-3 py-1 rounded-full">
            {registrations.length}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {reg.gameTitle}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      📍 {reg.city} · ⏱ {reg.duration} мин
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color} bg-background/50`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-muted">
                    👥 {reg.teamName}
                    {reg.timer && !reg.timer.canStart && reg.gameStatus !== 'RUNNING' && (
                      <span className="ml-3 font-mono">
                        ⏳ {formatTime(reg.timer.timeUntilStart)}
                      </span>
                    )}
                    {reg.timer?.canStart && reg.gameStatus !== 'RUNNING' && (
                      <span className="ml-3 text-success font-medium">🚀 Можно стартовать!</span>
                    )}
                  </div>
                  <span className="text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                    {isRunning ? 'Продолжить →' : 'Перейти в лобби →'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}