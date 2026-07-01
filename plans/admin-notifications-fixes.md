# План исправления проблем с уведомлениями в админ-панели

## Проблема 1: Настройки звука/баннеров не применяются

### Причина
В [`AdminNotificationBadge.tsx`](../apps/web/src/components/header/AdminNotificationBadge.tsx:64-71) настройки `soundEnabled` и `toastsEnabled` загружаются из `localStorage` один раз при монтировании компонента через `useEffect`. 

`fetchCounts` (строка 73) использует эти значения из состояния через замыкание. Когда пользователь меняет настройки на странице `/admin/settings`, `AdminNotificationBadge` не узнаёт об этом, потому что:
- Компонент не перемонтируется
- Нет механизма синхронизации между вкладками/страницами
- `fetchCounts` продолжает использовать старые значения из состояния

### Решение
Читать `localStorage` напрямую внутри `fetchCounts` вместо использования состояния React:

```typescript
const fetchCounts = useCallback(async () => {
  // Читаем настройки напрямую из localStorage каждый раз
  const soundOn = getStorageBoolean(STORAGE_KEY_SOUND, true);
  const toastsOn = getStorageBoolean(STORAGE_KEY_TOASTS, true);
  
  // ... остальная логика
  if (total > 0 && total > prevTotal) {
    if (soundOn) playNotificationSound();
    if (toastsOn) { /* показать toast */ }
  }
}, []); // <- пустой массив зависимостей, т.к. localStorage читается напрямую
```

### Файлы для изменения
- `apps/web/src/components/header/AdminNotificationBadge.tsx`

---

## Проблема 2: Баннеры дублируются на каждой вкладке

### Причина
В [`fetchCounts`](../apps/web/src/components/header/AdminNotificationBadge.tsx:73-107) условие `total > prevTotal` срабатывает, когда общее количество уведомлений увеличивается. Но:
- `prevTotalRef` хранит предыдущее значение в рамках одной вкладки
- Каждая вкладка браузера — отдельный JS-контекст
- Когда на одной вкладке уже показали toast, на другой вкладке `prevTotalRef` всё ещё равен 0
- При первом запросе на новой вкладке `total > 0` и `total > prevTotal` (0) — toast показывается снова

### Решение
Добавить глобальный Set (через модульную переменную, как уже сделано для `toasts`), который хранит "снимки" уже показанных уведомлений. Ключом будет строка вида `"applications:3-complaints:1-tickets:2"`.

```typescript
// Модульная переменная для отслеживания показанных уведомлений
const shownNotificationKeys = new Set<string>();

// В fetchCounts:
const notificationKey = `apps:${newCounts.pendingApplications}-complaints:${newCounts.pendingComplaints}-tickets:${newCounts.newSupportTickets}`;

if (total > 0 && total > prevTotal && !shownNotificationKeys.has(notificationKey)) {
  shownNotificationKeys.add(notificationKey);
  // ... звук и toast
}
```

### Файлы для изменения
- `apps/web/src/components/header/AdminNotificationBadge.tsx`

---

## Проблема 3: Индикаторы в AdminNav

### Причина
[`AdminNav.tsx`](../apps/web/src/components/admin/AdminNav.tsx:21-49) — это простой компонент навигации, который не принимает пропсы с количеством уведомлений и не отображает бейджи.

### Решение
1. Добавить в `AdminNavProps` опциональный пропс `counts?: AdminNotificationCounts`
2. Создать `countMap` аналогично тому, как это сделано в `DropdownNav` в Header
3. Отображать бейджи с количеством рядом с соответствующими пунктами меню

```tsx
interface AdminNavProps {
  userRole: string | null;
  counts?: AdminNotificationCounts | null;
}
```

Импортировать тип `AdminNotificationCounts` из `AdminNotificationBadge`.

### Файлы для изменения
- `apps/web/src/components/admin/AdminNav.tsx`

### Где используется AdminNav
Нужно найти все места, где используется `AdminNav`, и передать туда `counts`. Скорее всего, это layout-страницы админ-панели.

---

## Дополнительно: где используется AdminNav

Нужно найти все страницы/компоненты, которые рендерят `AdminNav`, чтобы передать им пропс `counts`.