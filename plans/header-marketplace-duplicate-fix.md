# Исправление дублирования кнопки "Маркетплейс" в Header

## Проблема

В Header.tsx кнопка "Маркетплейс" отображается дважды для авторизованных пользователей:
1. Как простая ссылка из `mainNavItems` (рендерится через `visibleMainNav.map(renderNavLink)`)
2. Как выпадающее меню `DropdownNav` с пунктами: Каталог, Мои покупки, Мои лицензии, Инструкция

## Решение

Убрать пункт "Маркетплейс" из `mainNavItems`. Для неавторизованных (GUEST) показывать простую ссылку на `/marketplace` отдельно. Для авторизованных — показывать `DropdownNav` с выпадающим меню.

## Изменения в файле `apps/web/src/components/ui/Header.tsx`

### 1. `mainNavItems` (строка 190-194)
Удалить пункт `{ label: 'Маркетплейс', href: '/marketplace', roles: [...] }`.

Было:
```typescript
const mainNavItems = [
  { label: 'Каталог игр', href: '/games', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
  { label: 'Маркетплейс', href: '/marketplace', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
  { label: 'Команды', href: '/teams', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
];
```

Стало:
```typescript
const mainNavItems = [
  { label: 'Каталог игр', href: '/games', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
  { label: 'Команды', href: '/teams', roles: ['GUEST', 'PLAYER', 'ORGANIZER', 'ADMIN'] },
];
```

### 2. Десктопная навигация (строки 286-295)
- Убрать `visibleMainNav.map(renderNavLink)` — он остаётся, но теперь там нет "Маркетплейс"
- Для GUEST: показывать простую ссылку `renderNavLink({ label: 'Маркетплейс', href: '/marketplace' })`
- Для авторизованных: показывать `DropdownNav` как сейчас

Было:
```tsx
<nav className="hidden lg:flex items-center gap-1">
  {visibleMainNav.map((item) => renderNavLink(item))}

  {/* Маркетплейс — выпадающее меню, только для авторизованных */}
  {user && (
    <>
      <span className="mx-1 w-px h-5 bg-border" />
      <DropdownNav label="Маркетплейс" items={marketplaceDropdownItems} pathname={pathname} />
    </>
  )}
  ...
</nav>
```

Стало:
```tsx
<nav className="hidden lg:flex items-center gap-1">
  {visibleMainNav.map((item) => renderNavLink(item))}

  {/* Маркетплейс — для GUEST простая ссылка, для авторизованных выпадающее меню */}
  {user ? (
    <>
      <span className="mx-1 w-px h-5 bg-border" />
      <DropdownNav label="Маркетплейс" items={marketplaceDropdownItems} pathname={pathname} />
    </>
  ) : (
    renderNavLink({ label: 'Маркетплейс', href: '/marketplace' })
  )}
  ...
</nav>
```

### 3. Мобильное меню (строки 507-549)
- `visibleMainNav` больше не содержит "Маркетплейс", так что дублирования не будет
- Для GUEST: добавить простую ссылку на `/marketplace` в блок "Основное"
- Для авторизованных: оставить отдельный блок "Маркетплейс" с выпадающими пунктами (как сейчас)

Было (строки 507-525):
```tsx
{/* Основные пункты */}
<div className="flex flex-col gap-1">
  <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
    Основное
  </p>
  {visibleMainNav.map((item) => (
    <Link ...>{item.label}</Link>
  ))}
</div>
```

Стало:
```tsx
{/* Основные пункты */}
<div className="flex flex-col gap-1">
  <p className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
    Основное
  </p>
  {visibleMainNav.map((item) => (
    <Link ...>{item.label}</Link>
  ))}
  {/* Маркетплейс — для неавторизованных простая ссылка */}
  {!user && (
    <Link href="/marketplace" ...>Маркетплейс</Link>
  )}
</div>
```

Блок для авторизованных (строки 528-549) остаётся без изменений.

## Проверка

1. Открыть страницу как GUEST (неавторизованный) — должна быть одна кнопка "Маркетплейс" как простая ссылка
2. Открыть страницу как PLAYER/ORGANIZER/ADMIN — должно быть выпадающее меню "Маркетплейс" с пунктами: Каталог, Мои покупки, Мои лицензии, Инструкция
3. Проверить мобильное меню для обоих случаев
4. Проверить, что остальные пункты навигации не затронуты