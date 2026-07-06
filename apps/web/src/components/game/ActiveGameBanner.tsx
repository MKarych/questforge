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

const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  PUBLISHED: { label: 'Ожидает старта', icon: '📅', color: 'text-primary' },
  REGISTRATION_OPEN: { label: 'Регистрация открыта', icon: '📝', color: 'text-success' },
  REGISTRATION_CLOSED: { label: 'Регистрация закрыта', icon: '🔒', color: 'text-info' },
  LOBBY: { label: 'Ожидание старта', icon: '🔄', color: 'text-warning' },
  RUNNING: { label: 'Идёт игра', icon: '🎮', color: 'text-warning' },
};

export default function ActiveGameBanner() {
  const [registrations, setRegistrations] = useState<ActiveRegistration[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRegistrations = useCallback(async () => {
    try {
      const response = await getMyActiveRegistrations();
      if (response.data && Array.isArray(response.data)) {
        setRegistrations(response.data);
      }
    } catch {
      // User not logged in or error — just hide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  // Авто-обновление каждые 15 секунд
  useEffect(() => {
    if (registrations.length === 0) return;
    const interval = setInterval(loadRegistrations, 15000);
    return () => clearInterval(interval);
  }, [registrations.length, loadRegistrations]);

  // Проверяем dismissed в localStorage
  useEffect(() => {
    const saved = localStorage.getItem('activeGameBannerDismissed');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Сбрасываем dismiss если прошло больше часа
      if (Date.now() - parsed.timestamp > 3600000) {
        localStorage.removeItem('activeGameBannerDismissed');
        setDismissed(false);
      } else {
        setDismissed(true);
      }
    }
  }, [registrations]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('activeGameBannerDismissed', JSON.stringify({ timestamp: Date.now() }));
  };

  if (loading || dismissed || registrations.length === 0) {
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
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20">
      <div className="container mx-auto px-4 py-2">
        {registrations.map((reg) => {
          const statusInfo = STATUS_LABELS[reg.gameStatus] || { label: reg.gameStatus, icon: '🎮', color: 'text-text-secondary' };
          const isRunning = reg.gameStatus === 'RUNNING';
          const lobbyLink = `/play/${reg.shareLink}/lobby`;
          const gameLink = isRunning && reg.sessionId
            ? `/play/${reg.shareLink}/${reg.sessionId}`
            : lobbyLink;

          return (
            <div key={reg.gameId} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{statusInfo.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm truncate">
                      {reg.gameTitle}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} bg-background/50`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>📍 {reg.city}</span>
                    <span>⏱ {reg.duration} мин</span>
                    <span>{reg.teamId ? '👥' : '👤'} {reg.teamName}</span>
                    {reg.timer && !reg.timer.canStart && reg.gameStatus !== 'RUNNING' && (
                      <span className="font-mono">
                        ⏳ {formatTime(reg.timer.timeUntilStart)}
                      </span>
                    )}
                    {reg.timer?.canStart && reg.gameStatus !== 'RUNNING' && (
                      <span className="text-success font-medium">🚀 Можно стартовать!</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={gameLink}
                  className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                >
                  {isRunning ? 'Продолжить игру' : 'Перейти в лобби'}
                </Link>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors"
                  title="Скрыть"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}