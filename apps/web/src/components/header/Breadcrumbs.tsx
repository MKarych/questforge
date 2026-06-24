'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  games: 'Каталог игр',
  teams: 'Команды',
  organizer: 'Организаторам',
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

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Хлебные крошки" className="hidden md:flex items-center">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            Главная
          </Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {crumb.isLast ? (
              <span className="text-text-secondary font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}