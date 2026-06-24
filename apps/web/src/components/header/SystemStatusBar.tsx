'use client';

import { useEffect, useState } from 'react';
import type { SystemStatus } from '@/lib/api/client';

interface SystemStatusBarProps {
  status: SystemStatus | null;
}

export default function SystemStatusBar({ status }: SystemStatusBarProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-error/10 border-b border-error/20 px-4 py-1.5 text-center">
        <span className="text-sm text-error font-medium">
          🔴 Нет подключения к интернету
        </span>
      </div>
    );
  }

  if (status?.status === 'maintenance') {
    return (
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-1.5 text-center">
        <span className="text-sm text-warning font-medium">
          🟡 Ведутся технические работы — {status.message}
        </span>
      </div>
    );
  }

  if (status?.status === 'beta') {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center">
        <span className="text-sm text-primary font-medium">
          🟢 Платформа в бета-режиме
        </span>
      </div>
    );
  }

  if (status?.status === 'error') {
    return (
      <div className="bg-error/10 border-b border-error/20 px-4 py-1.5 text-center">
        <span className="text-sm text-error font-medium">
          🔵 Проблемы с сервером — {status.message}
        </span>
      </div>
    );
  }

  return null;
}