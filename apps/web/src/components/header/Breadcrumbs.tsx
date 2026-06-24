'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  games: 'Каталог игр',
  teams: 'Команды',
  organizer: 'Организатору',
  dashboard: 'Панель',
  scenarios: 'Сценарии',
  create: 'Создание',
  edit: 'Редактирование',
  play: 'Игра',
  finish: 'Завершение',
  profile: 'Профиль',
  admin: 'Админка',
  notifications: 'Уведомления',
  auth: 'Авторизация',
  login: 'Вход',
  register: 'Регистрация',
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Не показываем на главной
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const currentLabel = ROUTE_LABELS[segments[segments.length - 1]] || decodeURIComponent(segments[segments.length - 1]);

  // Ссылка "назад" — на один уровень вверх
  const parentHref = segments.length > 1
    ? '/' + segments.slice(0, -1).join('/')
    : '/';

  return (
    <nav aria-label="Хлебные крошки" className="hidden md:flex items-center text-sm">
      <Link
        href={parentHref}
        className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors shrink-0"
        aria-label="Назад"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <span className="mx-2 text-text-muted">/</span>

      <span className="text-text-secondary font-medium truncate max-w-[200px]" title={currentLabel}>
        {currentLabel}
      </span>
    </nav>
  );
}