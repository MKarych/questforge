# План: удаление дублирующейся страницы /games/archive

## Проблема
- Есть отдельная страница `/games/archive` и вкладка "Архив" на `/games` — дублирование
- Ошибка `Invalid UUID` в `findOne` на бэкенде — не связана с архивом, это проблема роутинга (Next.js пытается загрузить данные для страницы `/games/archive` через API, который ожидает UUID)

## Решение

### 1. Удалить страницу `/games/archive`
- Удалить файл `apps/web/src/app/games/archive/page.tsx`
- Все ссылки на `/games/archive` теперь ведут на `/games` (где есть вкладка "Архив")

### 2. Обновить Header
- В `gamesCatalogDropdownItems` заменить `{ label: 'Архив игр', href: '/games/archive' }` на `{ label: 'Архив игр', href: '/games?tab=archived' }`

### 3. Обновить страницу `/games`
- Добавить чтение query-параметра `tab` из URL
- Если `?tab=archived` — сразу открывать вкладку "Архив"
- При переключении вкладок — обновлять URL (через `router.push` или `window.history`)

### 4. Ошибка `Invalid UUID`
- Ошибка в `games.service.ts:866` — метод `findOne` получает не-UUID строку
- Это происходит, когда Next.js пытается prefetch данные для страницы `/games/archive`, интерпретируя `archive` как gameId
- После удаления страницы `/games/archive` ошибка исчезнет сама собой

## Файлы для изменений

| Файл | Действие |
|------|----------|
| `apps/web/src/app/games/archive/page.tsx` | Удалить |
| `apps/web/src/components/ui/Header.tsx` | Изменить href в `gamesCatalogDropdownItems` |
| `apps/web/src/app/games/page.tsx` | Добавить чтение `?tab=archived` из URL, обновлять URL при переключении вкладок |