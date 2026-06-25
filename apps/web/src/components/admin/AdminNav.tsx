'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminNavProps {
  userRole: string | null;
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '📊 Дашборд', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/games/pending', label: '🎮 Модерация игр', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/organizers/applications', label: '📋 Заявки организаторов', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/support', label: '📬 Поддержка', roles: ['ADMIN', 'MODERATOR'] },
  { href: '/admin/users', label: '👥 Пользователи', roles: ['ADMIN'] },
  { href: '/admin/teams', label: '👥 Команды', roles: ['ADMIN', 'MODERATOR'] },
];

export default function AdminNav({ userRole }: AdminNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Точное совпадение для главных страниц, startsWith для вложенных (например /admin/teams/[id])
    if (href === '/admin/teams') {
      return pathname.startsWith('/admin/teams');
    }
    return pathname === href;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {NAV_ITEMS.filter((item) => item.roles.includes(userRole || '')).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive(item.href)
              ? 'bg-primary text-white'
              : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}