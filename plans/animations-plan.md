# План добавления анимаций в QuestForge

## 1. Анализ текущего состояния

### 1.1. Существующие анимации в `globals.css`

| Анимация | Где используется | Статус |
|----------|-----------------|--------|
| `transition: background-color 0.2s ease, color 0.2s ease` | `body` (смена темы) | ✅ Есть |
| `transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease` | `input`, `textarea` | ✅ Есть |
| `transition-all duration-200` | `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.card-hover`, `.input-field` | ✅ Есть |
| `transition-colors duration-200` | `.card-hover`, `.input-field` | ✅ Есть |
| `@keyframes node-appear` | React Flow узлы | ✅ Есть |
| `@keyframes edge-draw` | React Flow рёбра | ✅ Есть |
| `@keyframes slide-up` / `.animate-slide-up` | Панели и модалки | ✅ Есть |
| `@keyframes scale-in` / `.animate-scale-in` | Модалки | ✅ Есть |
| `@keyframes pulse-slow` / `.animate-pulse-slow` | PRO-кнопка | ✅ Есть |
| `@keyframes fade-in-down` / `.animate-fade-in-down` | Hero-блок | ✅ Есть |
| `@keyframes float` / `.animate-float` | Декоративные элементы | ✅ Есть |
| `@keyframes float-slow` / `.animate-float-slow` | Декоративные элементы | ✅ Есть |
| `animate-pulse` | Skeleton-компоненты | ✅ Есть (Tailwind) |
| `animate-spin` | LoadingSpinner | ✅ Есть (Tailwind) |

### 1.2. Tailwind config (`tailwind.config.js`)

- **Кастомные анимации отсутствуют** — в `theme.extend` нет секции `animation` или `keyframes`
- Есть только кастомные цвета, шрифты и border-radius

### 1.3. Ключевые компоненты и их текущее состояние

| Компонент | Файл | Текущие анимации | Проблемы |
|-----------|------|------------------|----------|
| **Header** | `ui/Header.tsx` | `transition-colors` на ссылках и кнопках | Нет анимации появления мобильного меню, нет hover-эффекта на логотипе |
| **Footer** | `ui/Footer.tsx` | `transition-colors` на ссылках | Нет анимации появления секций |
| **GameCard** | `ui/GameCard.tsx` | `group-hover:scale-105` на изображении, `group-hover:text-primary` на заголовке | Нет hover-эффекта на всей карточке (lift), нет анимации появления |
| **HeroBlock** | `home/HeroBlock.tsx` | `hover:-translate-y-0.5` на кнопках, `animate-fade-in-down` отсутствует в JSX | Анимация появления не применяется к контенту |
| **CTABlock** | `home/CTABlock.tsx` | `hover:-translate-y-0.5` на кнопках | Нет анимации появления блока |
| **ConfirmModal** | `ui/ConfirmModal.tsx` | `animate-in fade-in zoom-in` (классы animate.css?) | Нет анимации закрытия |
| **ImageModal** | `ui/ImageModal.tsx` | Нет анимаций | Нет fade-in при открытии |
| **ScrollToTop** | `ui/ScrollToTop.tsx` | `hover:scale-110`, `transition-all duration-300` | Нет анимации появления/исчезания кнопки |
| **LoadingSpinner** | `ui/LoadingSpinner.tsx` | `animate-spin` | Базовая анимация, можно улучшить |
| **Skeleton** | `ui/Skeleton.tsx` | `animate-pulse` | Базовая анимация, можно улучшить |
| **StatusBadge** | `ui/StatusBadge.tsx` | Нет анимаций | Нет микро-анимации при появлении |
| **UserMenu** | `header/UserMenu.tsx` | `transition-colors` | Нет анимации выпадающего меню |
| **NotificationBell** | `header/NotificationBell.tsx` | Нет анимаций | Нет анимации выпадающего меню |
| **ThemeSwitcher** | `header/ThemeSwitcher.tsx` | `transition-colors` | Нет анимации переключения иконки |
| **CookieBanner** | `ui/CookieBanner.tsx` | `transition-all duration-300` | Нет slide-up при появлении |
| **EmptyState** | `ui/EmptyState.tsx` | Нет анимаций | Нет fade-in при появлении |
| **StatsBar** | `home/StatsBar.tsx` | Нет анимаций | Нет анимации появления карточек статистики |
| **WhyUs** | `home/WhyUs.tsx` | Нет анимаций | Нет анимации появления карточек |
| **ReviewsSection** | `home/ReviewsSection.tsx` | Нет анимаций | Нет анимации появления отзывов |
| **GamesSection** | `home/GamesSection.tsx` | Нет анимаций | Нет анимации появления сетки игр |

---

## 2. План изменений

### 2.1. Добавить кастомные анимации в `tailwind.config.js`

В секцию `theme.extend` добавить:

```js
animation: {
  'fade-in': 'fade-in 0.5s ease-out both',
  'fade-in-up': 'fade-in-up 0.5s ease-out both',
  'fade-in-down': 'fade-in-down 0.6s ease-out both',
  'slide-up': 'slide-up 0.3s ease-out both',
  'slide-down': 'slide-down 0.3s ease-out both',
  'scale-in': 'scale-in 0.2s ease-out both',
  'scale-out': 'scale-out 0.15s ease-in both',
  'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
  'float': 'float 4s ease-in-out infinite',
  'float-slow': 'float-slow 6s ease-in-out infinite',
  'skeleton-shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
  'spin-slow': 'spin 2s linear infinite',
  'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
},
keyframes: {
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  'fade-in-up': {
    from: { opacity: '0', transform: 'translateY(16px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'slide-down': {
    from: { opacity: '0', transform: 'translateY(-8px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'scale-out': {
    from: { opacity: '1', transform: 'scale(1)' },
    to: { opacity: '0', transform: 'scale(0.92)' },
  },
  'skeleton-shimmer': {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
  'bounce-subtle': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-3px)' },
  },
}
```

### 2.2. Добавить CSS-классы в `globals.css`

Добавить в секцию `@layer components`:

```css
/* Hover lift для карточек */
.card-hover-lift {
  @apply card-hover transition-all duration-300;
}

.card-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Link underline animation */
.link-underline {
  @apply relative inline-block;
}

.link-underline::after {
  content: '';
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300;
}

.link-underline:hover::after {
  @apply w-full;
}

/* Button press effect */
.btn-press {
  @apply active:scale-[0.97] transition-transform duration-100;
}

/* Skeleton shimmer enhancement */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-elevated) 25%,
    var(--color-surface) 50%,
    var(--color-surface-elevated) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```

### 2.3. Пошаговые изменения компонентов

#### Шаг 1: `tailwind.config.js` — добавить кастомные анимации

**Файл:** `apps/web/tailwind.config.js`
**Что сделать:** Добавить секции `animation` и `keyframes` в `theme.extend`

---

#### Шаг 2: `globals.css` — добавить вспомогательные классы

**Файл:** `apps/web/src/styles/globals.css`
**Что сделать:**
- Добавить `.card-hover-lift` — карточка поднимается на 4px при hover
- Добавить `.link-underline` — подчёркивание ссылки появляется слева направо
- Добавить `.btn-press` — кнопка слегка "вдавливается" при клике
- Добавить `.skeleton-shimmer` — улучшенный скелетон с градиентным shimmer

---

#### Шаг 3: `GameCard.tsx` — hover lift и анимация появления

**Файл:** `apps/web/src/components/ui/GameCard.tsx`
**Что сделать:**
- Заменить `card-hover` на `card-hover-lift` на контейнере `<Link>`
- Добавить `animate-fade-in-up` на карточку (с задержкой через `style={{ animationDelay }}` или через nth-child)
- Улучшить `group-hover:scale-105` на изображении до `group-hover:scale-110` и добавить `transition-transform duration-500`

---

#### Шаг 4: `Header.tsx` — анимации навигации и мобильного меню

**Файл:** `apps/web/src/components/ui/Header.tsx`
**Что сделать:**
- Добавить `animate-slide-down` на мобильное меню (панель справа)
- Добавить `animate-fade-in` на overlay затемнения
- Добавить `hover:scale-105` на логотип при hover (группа `group`)
- Добавить `btn-press` на кнопки в хедере

---

#### Шаг 5: `Footer.tsx` — анимация ссылок и секций

**Файл:** `apps/web/src/components/ui/Footer.tsx`
**Что сделать:**
- Заменить `transition-colors` на `link-underline` для ссылок в футере
- Добавить `animate-fade-in-up` на колонки футера с staggered задержкой

---

#### Шаг 6: `HeroBlock.tsx` — анимация появления контента

**Файл:** `apps/web/src/components/home/HeroBlock.tsx`
**Что сделать:**
- Добавить `animate-fade-in-down` на контейнер `.flex.flex-col.items-center` (уже есть класс в CSS, но не используется в JSX)
- Добавить `animate-fade-in-up` на кнопки с задержкой
- Добавить `btn-press` на кнопки

---

#### Шаг 7: `CTABlock.tsx` — анимация появления

**Файл:** `apps/web/src/components/home/CTABlock.tsx`
**Что сделать:**
- Добавить `animate-fade-in-up` на секцию
- Добавить `btn-press` на кнопки

---

#### Шаг 8: `ConfirmModal.tsx` — анимация открытия/закрытия

**Файл:** `apps/web/src/components/ui/ConfirmModal.tsx`
**Что сделать:**
- Заменить `animate-in fade-in zoom-in` на `animate-scale-in` (уже есть в CSS)
- Добавить `animate-fade-in` на overlay
- Добавить анимацию закрытия: при `!isOpen` плавно скрывать

---

#### Шаг 9: `ImageModal.tsx` — fade-in при открытии

**Файл:** `apps/web/src/components/ui/ImageModal.tsx`
**Что сделать:**
- Добавить `animate-fade-in` на overlay
- Добавить `animate-scale-in` на контейнер с изображением

---

#### Шаг 10: `ScrollToTop.tsx` — анимация появления/исчезания

**Файл:** `apps/web/src/components/ui/ScrollToTop.tsx`
**Что сделать:**
- Заменить `if (!visible) return null` на CSS-классы с `transition-opacity`
- Добавить `opacity-0` / `opacity-100` с `transition-opacity duration-300`
- Добавить `animate-bounce-subtle` при hover

---

#### Шаг 11: `LoadingSpinner.tsx` — улучшенная анимация

**Файл:** `apps/web/src/components/ui/LoadingSpinner.tsx`
**Что сделать:**
- Заменить `animate-spin` на `animate-spin-slow` (более плавное вращение)
- Добавить `animate-fade-in` на контейнер

---

#### Шаг 12: `Skeleton.tsx` — shimmer-эффект

**Файл:** `apps/web/src/components/ui/Skeleton.tsx`
**Что сделать:**
- Заменить `animate-pulse` на `skeleton-shimmer` (класс из globals.css)
- Добавить градиентный фон для shimmer-эффекта

---

#### Шаг 13: `StatusBadge.tsx` — микро-анимация появления

**Файл:** `apps/web/src/components/ui/StatusBadge.tsx`
**Что сделать:**
- Добавить `animate-scale-in` на badge при монтировании

---

#### Шаг 14: `UserMenu.tsx` — анимация выпадающего меню

**Файл:** `apps/web/src/components/header/UserMenu.tsx`
**Что сделать:**
- Добавить `animate-slide-down` на выпадающее меню
- Добавить `animate-fade-in` на элементы меню с staggered задержкой

---

#### Шаг 15: `NotificationBell.tsx` — анимация выпадающего меню

**Файл:** `apps/web/src/components/header/NotificationBell.tsx`
**Что сделать:**
- Добавить `animate-slide-down` на выпадающее меню уведомлений

---

#### Шаг 16: `ThemeSwitcher.tsx` — анимация переключения иконки

**Файл:** `apps/web/src/components/header/ThemeSwitcher.tsx`
**Что сделать:**
- Добавить `transition-transform duration-300` и `hover:scale-110` на кнопку
- Добавить `animate-rotate` для иконки при переключении (через keyframe)

---

#### Шаг 17: `CookieBanner.tsx` — slide-up при появлении

**Файл:** `apps/web/src/components/ui/CookieBanner.tsx`
**Что сделать:**
- Добавить `animate-slide-up` на баннер при появлении
- Добавить `animate-scale-in` на модалку детальных настроек

---

#### Шаг 18: `EmptyState.tsx` — fade-in при появлении

**Файл:** `apps/web/src/components/ui/EmptyState.tsx`
**Что сделать:**
- Добавить `animate-fade-in-up` на контейнер

---

#### Шаг 19: Home-компоненты — анимация появления при скролле

**Файлы:**
- `apps/web/src/components/home/StatsBar.tsx`
- `apps/web/src/components/home/WhyUs.tsx`
- `apps/web/src/components/home/ReviewsSection.tsx`
- `apps/web/src/components/home/GamesSection.tsx`

**Что сделать:**
- Добавить `animate-fade-in-up` на секции
- Для staggered-анимации карточек внутри секций использовать `style={{ animationDelay: `${index * 100}ms` }}`

---

#### Шаг 20: `GamesSection.tsx` — staggered анимация для GameCard

**Файл:** `apps/web/src/components/home/GamesSection.tsx`
**Что сделать:**
- Передать `index` в `GameCardComponent` для staggered задержки
- Добавить `animate-fade-in-up` на каждую карточку с `animationDelay`

---

## 3. Сводная таблица изменений

| # | Файл | Тип изменений | Сложность |
|---|------|---------------|-----------|
| 1 | `tailwind.config.js` | Добавить `animation` и `keyframes` | ★☆☆ |
| 2 | `globals.css` | Добавить `.card-hover-lift`, `.link-underline`, `.btn-press`, `.skeleton-shimmer` | ★☆☆ |
| 3 | `ui/GameCard.tsx` | Hover lift + fade-in-up | ★☆☆ |
| 4 | `ui/Header.tsx` | Slide-down меню, fade-in overlay, hover scale | ★★☆ |
| 5 | `ui/Footer.tsx` | Link underline, fade-in-up колонки | ★☆☆ |
| 6 | `home/HeroBlock.tsx` | Fade-in-down контент, fade-in-up кнопки | ★☆☆ |
| 7 | `home/CTABlock.tsx` | Fade-in-up, btn-press | ★☆☆ |
| 8 | `ui/ConfirmModal.tsx` | Scale-in, fade-in overlay | ★☆☆ |
| 9 | `ui/ImageModal.tsx` | Fade-in, scale-in | ★☆☆ |
| 10 | `ui/ScrollToTop.tsx` | Opacity transition, bounce-subtle | ★☆☆ |
| 11 | `ui/LoadingSpinner.tsx` | Spin-slow, fade-in | ★☆☆ |
| 12 | `ui/Skeleton.tsx` | Shimmer вместо pulse | ★☆☆ |
| 13 | `ui/StatusBadge.tsx` | Scale-in | ★☆☆ |
| 14 | `header/UserMenu.tsx` | Slide-down меню | ★☆☆ |
| 15 | `header/NotificationBell.tsx` | Slide-down меню | ★☆☆ |
| 16 | `header/ThemeSwitcher.tsx` | Hover scale, rotate иконки | ★☆☆ |
| 17 | `ui/CookieBanner.tsx` | Slide-up, scale-in | ★☆☆ |
| 18 | `ui/EmptyState.tsx` | Fade-in-up | ★☆☆ |
| 19 | Home-секции (StatsBar, WhyUs, Reviews) | Fade-in-up | ★☆☆ |
| 20 | `home/GamesSection.tsx` | Staggered fade-in-up для GameCard | ★★☆ |

---

## 4. Принципы анимаций

1. **Subtle (нежные)** — все анимации должны быть едва заметными, длительностью 200-500ms
2. **Ease-out** — предпочтительная функция timing для появления элементов
3. **Не конфликтовать с React Flow** — не использовать `transform` на узлах редактора
4. **Не менять цвета** — только `opacity`, `transform`, `box-shadow`
5. **Производительность** — использовать только `opacity` и `transform` (GPU-акселерация)
6. **prefers-reduced-motion** — добавить `@media (prefers-reduced-motion: reduce)` для отключения анимаций

---

## 5. prefers-reduced-motion

Добавить в `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Порядок выполнения

1. ✅ `tailwind.config.js` — добавить keyframes и animation
2. ✅ `globals.css` — добавить вспомогательные классы и prefers-reduced-motion
3. ✅ `ui/GameCard.tsx` — hover lift + fade-in-up
4. ✅ `ui/Header.tsx` — мобильное меню + hover эффекты
5. ✅ `ui/Footer.tsx` — link underline + fade-in-up
6. ✅ `home/HeroBlock.tsx` — fade-in-down контент
7. ✅ `home/CTABlock.tsx` — fade-in-up
8. ✅ `ui/ConfirmModal.tsx` — scale-in
9. ✅ `ui/ImageModal.tsx` — fade-in
10. ✅ `ui/ScrollToTop.tsx` — opacity transition
11. ✅ `ui/LoadingSpinner.tsx` — spin-slow
12. ✅ `ui/Skeleton.tsx` — shimmer
13. ✅ `ui/StatusBadge.tsx` — scale-in
14. ✅ `header/UserMenu.tsx` — slide-down
15. ✅ `header/NotificationBell.tsx` — slide-down
16. ✅ `header/ThemeSwitcher.tsx` — hover scale
17. ✅ `ui/CookieBanner.tsx` — slide-up
18. ✅ `ui/EmptyState.tsx` — fade-in-up
19. ✅ Home-секции — fade-in-up
20. ✅ `home/GamesSection.tsx` — staggered cards