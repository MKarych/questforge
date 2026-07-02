'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export interface AdminNotificationCounts {
  pendingApplications: number;
  pendingComplaints: number;
  newSupportTickets: number;
  pendingScenarios: number;
}

interface AdminNavProps {
  userRole: string | null;
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '📊 Дашборд', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/games', label: '🎮 Все игры', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/scenarios', label: '📜 Сценарии', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/complaints', label: '🚨 Жалобы', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/requests', label: '📋 Заявки', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/support', label: '📬 Поддержка', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/users', label: '👥 Пользователи', roles: ['ADMIN'] },
  { href: '/admin/teams', label: '👥 Команды', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/settings', label: '⚙️ Настройки', roles: ['ADMIN', 'MODERATOR'] },
];

// Маппинг href -> ключ в AdminNotificationCounts
const COUNT_MAP: Record<string, keyof AdminNotificationCounts> = {
  '/admin/complaints': 'pendingComplaints',
  '/admin/requests': 'pendingApplications',
  '/admin/support': 'newSupportTickets',
  '/admin/scenarios': 'pendingScenarios',
};

export default function AdminNav({ userRole }: AdminNavProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminNotificationCounts | null>(null);

  // Фетчим counts каждые 30 секунд
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await apiClient.getAdminNotificationCounts();
        setCounts(res.data);
      } catch {
        // Игнорируем ошибки
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    // Точное совпадение для главных страниц, startsWith для вложенных (например /admin/teams/[id])
    if (href === '/admin/teams') {
      return pathname.startsWith('/admin/teams');
    }
    return pathname === href;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {NAV_ITEMS.filter((item) => item.roles.includes(userRole || '')).map((item) => {
        const countKey = COUNT_MAP[item.href];
        const itemCount = countKey && counts ? counts[countKey] : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-primary text-white'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <span>{item.label}</span>
            {itemCount !== undefined && itemCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-error rounded-full">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}