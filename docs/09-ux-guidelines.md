# UX Guidelines: Полная UX-архитектура платформы

> **Кодовое имя проекта:** Город Приключений (Adventure Engine)
> **Уровень документа:** UX-архитектура и дизайн-система
> **Статус:** Утвержден
> **Версия:** 2.0 (с поддержкой светлой/тёмной темы)

---

## 1. Принципы дизайна

### 1.1. Простота
> **Минимум кликов, максимум понятности.**

- Игрок делает не более 2 действий на экране.
- Организатор находит нужную функцию за 3 клика.
- Никаких лишних полей, вопросов, шагов.

### 1.2. Скорость
> **Страницы загружаются < 1 секунды.**

- Минимальный вес страниц.
- Кэширование статики.
- Оптимизация изображений.

### 1.3. Доверие
> **Пользователь знает, что происходит.**

- Каждое действие имеет визуальный фидбек.
- Ошибки объяснены понятным языком.
- Прогресс всегда виден.

### 1.4. Адаптивность
> **Работает на любом устройстве.**

- Телефон (320px) → Планшет → Десктоп (1920px).
- Все компоненты резиновые.
- Touch-friendly (кнопки > 44px).

### 1.5. Фидбек
> **Каждое действие — реакция.**

- Нажатие кнопки → спиннер или анимация.
- Отправка ответа → успех/ошибка.
- Переход между заданиями → плавная анимация.

---

## 2. Цветовая схема (Dark / Light)

### 2.1. Тёмная тема (по умолчанию)

| Назначение | HEX | Пример |
| :--- | :--- | :--- |
| **Primary** (Основной) | `#3B82F6` | Кнопки, ссылки, акценты |
| **Background** (Фон) | `#0F1117` | Основной фон страницы |
| **Surface** (Карточки) | `#181B26` | Карточки, панели, инпуты |
| **Border** (Границы) | `#2A2F3F` | Разделители, рамки |
| **Text** (Текст) | `#E4E4E7` | Основной текст |
| **Text Dim** (Второстепенный) | `#888EA8` | Подписи, хелперы |
| **Success** (Успех) | `#059669` | Успешные действия |
| **Error** (Ошибка) | `#DC2626` | Ошибки, предупреждения |
| **Warning** (Предупреждение) | `#F59E0B` | Внимание |
| **Shadow** (Тень) | `rgba(0,0,0,0.3)` | Тени карточек, модалок |

### 2.2. Светлая тема

| Назначение | HEX | Пример |
| :--- | :--- | :--- |
| **Primary** (Основной) | `#3B82F6` | Кнопки, ссылки, акценты |
| **Background** (Фон) | `#F8F9FA` | Основной фон страницы |
| **Surface** (Карточки) | `#FFFFFF` | Карточки, панели, инпуты |
| **Border** (Границы) | `#E5E7EB` | Разделители, рамки |
| **Text** (Текст) | `#111827` | Основной текст |
| **Text Dim** (Второстепенный) | `#6B7280` | Подписи, хелперы |
| **Success** (Успех) | `#059669` | Успешные действия |
| **Error** (Ошибка) | `#DC2626` | Ошибки, предупреждения |
| **Warning** (Предупреждение) | `#F59E0B` | Внимание |
| **Shadow** (Тень) | `rgba(0,0,0,0.06)` | Тени карточек, модалок |

---

## 3. Реализация тем (CSS-переменные)

### 3.1. Глобальные переменные

```css
/* apps/web/src/styles/globals.css */

:root {
  /* Светлая тема (по умолчанию) */
  --color-background: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-success: #059669;
  --color-error: #DC2626;
  --color-warning: #F59E0B;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

[data-theme="dark"] {
  --color-background: #0F1117;
  --color-surface: #181B26;
  --color-border: #2A2F3F;
  --color-text-primary: #E4E4E7;
  --color-text-secondary: #888EA8;
  --color-primary: #3B82F6;
  --color-primary-hover: #60A5FA;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
3.2. Компонент переключателя темы (уже в шапке)
tsx
// apps/web/src/components/ThemeSwitcher.tsx
'use client';

import { useEffect, useState } from 'react';

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Переключить тему"
      className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      title={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
4. Типографика
css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
Стиль	Размер	Вес	Применение
H1	32px	700	Заголовки страниц
H2	24px	600	Заголовки секций
H3	18px	600	Заголовки карточек
Body	16px	400	Основной текст
Small	14px	400	Подписи, хелперы
Tiny	12px	400	Мелкие подписи
5. Компоненты
5.1. Кнопки
Тип	Стиль
Primary	background: var(--color-primary); color: white; padding: 12px 24px; border-radius: var(--radius-md); font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;
Primary Hover	background: var(--color-primary-hover); transform: scale(1.02);
Secondary	background: transparent; color: var(--color-text-primary); border: 1px solid var(--color-border); padding: 12px 24px; border-radius: var(--radius-md); font-weight: 500;
Danger	background: var(--color-error); color: white; padding: 12px 24px; border-radius: var(--radius-md); font-weight: 600;
Ghost	background: transparent; color: var(--color-primary); padding: 8px 16px; border: none; cursor: pointer;
Пример использования:

tsx
<button className="btn-primary">Сохранить</button>
<button className="btn-secondary">Отмена</button>
<button className="btn-danger">Удалить</button>
5.2. Инпуты
css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  color: var(--color-text-primary);
  font-size: 16px;
  width: 100%;
  transition: border 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-secondary);
}
5.3. Карточки
css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: border 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-sm);
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
5.4. Индикаторы статуса
css
.status-active {
  background: var(--color-success);
  color: white;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: var(--color-warning);
  color: #1F2937;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
}

.status-error {
  background: var(--color-error);
  color: white;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
}
6. Структура шапки (Header)
6.1. Умный Header (слева направо)
text
[Logo]  [Breadcrumbs]  [Навигация]  [Поиск]  [Уведомления]  [Тема]  [Язык]  [Профиль]
6.2. Компоненты шапки
Компонент	Описание	Видимость
Logo	Логотип платформы, ведёт на /	Всегда
Breadcrumbs	Хлебные крошки (кроме главной)	Всегда
Navigation	Каталог, Команды, Создать игру, Админка	По ролям
SearchBar	Глобальный поиск (Ctrl+K)	Всегда
CommandPalette	Палитра команд	Всегда
NotificationBell	Уведомления с бейджиком	Авторизованным
ThemeSwitcher	Переключение 🌙/☀️	Всегда
LanguageSwitcher	RU / EN	Всегда
UserMenu	Профиль, настройки, выход	Авторизованным
6.3. Стиль шапки
css
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
  transition: box-shadow 0.3s;
}

.header.scrolled {
  box-shadow: var(--shadow-md);
}
7. Макеты страниц
7.1. Главная страница (публичная)
text
┌─────────────────────────────────────────────────────────────────┐
│  🏙️ Город Приключений          [Поиск] [🔔] [🌙] [🌐] [👤]  │
│  ──────────────────────────────────────────────────────────────│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │   🏙️ Город Приключений                                │ │
│  │   Городские игры нового поколения                      │ │
│  │                                                         │ │
│  │   [🎯 Выбрать игру]  [🚀 Стать организатором]         │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  📊 120+ игр  |  430+ команд  |  5800+ игроков              │
│                                                               │
│  🔥 Доступные игры                    [Смотреть все →]       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Тайны    │ │ Ночной   │ │ Истории  │ │ Секреты  │       │
│  │ Минска   │ │ Дозор    │ │ Города   │ │ Квартала │       │
│  │ ⭐ 4.8   │ │ ⭐ 4.9   │ │ ⭐ 4.7   │ │ ⭐ 4.6   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  🏆 Лучшие организаторы                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Иван     │ │ Мария    │ │ Алексей  │                     │
│  │ ⭐ 4.9   │ │ ⭐ 4.8   │ │ ⭐ 4.7   │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
│                                                               │
│  ❓ Часто задаваемые вопросы                                  │
│  ──────────────────────────────────────────────────────────────│
│  ▸ Как создать команду?                                      │
│  ▸ Как участвовать в игре?                                   │
│  ▸ Как стать организатором?                                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🚀 Готов к приключениям?                              │ │
│  │  [🎯 Выбрать игру]  [✍️ Создать свою]                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
7.2. Каталог игр
text
┌─────────────────────────────────────────────────────────────────┐
│  🎮 Каталог игр                                  [Фильтры]  │
│  ──────────────────────────────────────────────────────────────│
│                                                               │
│  Фильтры: [Город ▼] [Дата ▼] [Тип ▼] [Сложность ▼]         │
│                                                               │
│  Найдено: 12 игр                                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🚗 "Тайны Минска"                          ⭐ 4.8 (45) │ │
│  │ 📍 Минск  |  🗓 20.06 19:00  |  ⏱ 3 часа             │ │
│  │ 👥 3-5 человек  |  💰 15 BYN  |  🟢 Есть места       │ │
│  │ [Подробнее]                                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🌙 "Ночной дозор"                          ⭐ 4.9 (32) │ │
│  │ 📍 Минск  |  🗓 21.06 21:00  |  ⏱ 2.5 часа          │ │
│  │ 👥 2-4 человека  |  💰 12 BYN  |  🟢 Есть места      │ │
│  │ [Подробнее]                                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Показать еще]                                               │
└─────────────────────────────────────────────────────────────────┘
7.3. Страница игры
text
┌─────────────────────────────────────────────────────────────────┐
│  🎮 Тайны старого города                                      │
│  ──────────────────────────────────────────────────────────────│
│                                                               │
│  📍 Минск  |  🗓 20.06.2026 19:00  |  ⏱ 3 часа             │
│  🏷 Автоквест  |  👥 3-5 человек  |  💰 15 BYN              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ОПИСАНИЕ                                              │ │
│  │  Прогулка по историческому центру Минска...            │ │
│  │                                                         │ │
│  │  ⭐ Рейтинг: 4.8 (45 отзывов)                          │ │
│  │                                                         │ │
│  │  [🎯 Участвовать]  [❤️ В избранное]                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  🧑‍💼 Организатор: Иван Иванов                               │
│  Провел: 12 игр  |  Рейтинг: 4.9  |  Город: Минск           │
│                                                               │
│  💬 Отзывы (45)                                               │
│  ──────────────────────────────────────────────────────────────│
│  ⭐⭐⭐⭐⭐ "Отличная игра!" — Алексей                        │
│  ⭐⭐⭐⭐⭐ "Лучший автоквест!" — Мария                       │
│  ⭐⭐⭐⭐ "Интересно, но сложно" — Дмитрий                   │
│  [Оставить отзыв]                                            │
└─────────────────────────────────────────────────────────────────┘
8. Анимации и переходы
8.1. Загрузка
css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
8.2. Переходы между заданиями
css
.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
8.3. Успех/Ошибка
css
.success-pulse {
  animation: successPulse 0.5s ease-out;
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.error-shake {
  animation: errorShake 0.5s ease-out;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
8.4. Переключение темы
css
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
9. Адаптивность (Responsive)
Breakpoint	Ширина	Адаптация
Desktop	> 1440px	Полная версия
Laptop	1024px — 1440px	Уменьшенные отступы
Tablet	768px — 1024px	Гамбургер-меню
Mobile	< 768px	Гамбургер, карточки в 1 колонку
10. Доступность (Accessibility)
10.1. Контрастность
Текст на фоне: контрастность > 4.5:1

Крупный текст (>18px): контрастность > 3:1

10.2. Фокус
css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
10.3. ARIA-атрибуты
html
<button aria-label="Отправить ответ">📤 Отправить</button>
<div role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
  40%
</div>
11. Offline-first поведение
11.1. Индикатор офлайн
css
.offline-indicator {
  background: var(--color-error);
  color: white;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FCA5A5;
  animation: pulse 2s infinite;
}
12. Итоговые принципы
Минимализм. Ничего лишнего. Только то, что нужно пользователю.

Скорость. Страницы загружаются моментально, действия откликаются мгновенно.

Понятность. Пользователь всегда знает, что происходит и что делать дальше.

Доверие. Интерфейс выглядит профессионально и надежно.

Доступность. Интерфейс работает для всех пользователей.

Event-Driven. UI реагирует на события, а не на запросы.

Offline-First. Интерфейс работает без интернета.

State-Aware. UI всегда отражает текущее состояние системы.

Темы. Поддержка светлой и тёмной темы с плавным переключением.

Кодовое имя проекта: Город Приключений (Adventure Engine)
Главный принцип: UI — это реакция на события в распределённой системе. Сервер — единственный источник истины.