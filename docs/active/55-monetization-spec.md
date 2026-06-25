markdown
# 55. Monetization Spec: Полная система монетизации платформы

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Продуктовый контракт (10/10)  
> **Цель:** Описать полноценную billing infrastructure уровня SaaS-платформы — тарифы, оплату, учёт денег, права доступа, возвраты и выплаты авторам.

---

## 1. Принципы монетизации

1. **Freemium модель.** Базовая функциональность — бесплатно. Расширенная — платно.
2. **AI-помощник — платный.** Бесплатно — 3 генерации в день. PRO — 50+.
3. **Маркетплейс сценариев.** Комиссия платформы — 20-30%.
4. **Подписка PRO для организаторов.** Расширенные возможности.
5. **Корпоративные лицензии.** Для музеев, школ, бизнеса.

---

## 2. Тарифы и цены

### 2.1. AI-помощник

| Тариф | Генераций в день | Цена |
|-------|------------------|------|
| **Free** | 3 | 0 ₽ |
| **PRO** | 50 | 990 ₽/мес |
| **Business** | 500 | 2990 ₽/мес |

### 2.2. Подписка PRO для организаторов

| Тариф | Игр | Команд | Аналитика | AI-помощник | Цена |
|-------|-----|--------|-----------|-------------|------|
| **Free** | 1 | 10 | Базовая | ❌ | 0 ₽ |
| **PRO** | 10 | 50 | Расширенная | ✅ | 990 ₽/мес |
| **Business** | 100 | 500 | Полная | ✅ | 2990 ₽/мес |

### 2.3. Маркетплейс сценариев (роялти)

| Кто | Доля |
|-----|------|
| **Автор** | 70% |
| **Платформа** | 30% |

**Типы лицензий:**

| Лицензия | Цена | Что даёт |
|----------|------|----------|
| **Одно проведение** | 5-15 ₽ | Провести игру 1 раз |
| **Многоразовая (город)** | 29-49 ₽ | Проводить в одном городе |
| **Коммерческая** | 99-199 ₽ | Проводить где угодно |
| **White Label** | 299-499 ₽ | Свой бренд |

### 2.4. Платные плагины и блоки

| Тип | Пример | Цена |
|-----|--------|------|
| **Блоки** | GPS Puzzle Pack, Dialogue Pack | 50-200 ₽ |
| **Темы** | Хоррор тема, Детектив тема | 100-300 ₽ |
| **Интеграции** | Telegram Bot, VK Mini App | 200-500 ₽ |

### 2.5. Корпоративные лицензии

| Кому | Что даём | Цена |
|------|----------|------|
| **Музеи** | Белый брендинг, 50+ игр | 4990 ₽/мес |
| **Школы** | Образовательные сценарии | 2990 ₽/мес |
| **Корпорации** | Тимбилдинги, аналитика | 9990 ₽/мес |

---

## 3. Страница покупки `/upgrade`

**Макет:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  💰 Монетизация                                               │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Выберите тариф                                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Free        │  │  PRO         │  │  Business    │         │
│  │  0 ₽         │  │  990 ₽/мес   │  │  2990 ₽/мес  │         │
│  │              │  │              │  │              │         │
│  │  3 генерации │  │  50 генераций│  │  500 генерац │         │
│  │  1 игра      │  │  10 игр      │  │  100 игр     │         │
│  │  10 команд   │  │  50 команд   │  │  500 команд  │         │
│  │              │  │              │  │              │         │
│  │  [Текущий]   │  │  [Купить]    │  │  [Купить]    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  💳 Оплата                                                     │
│  ──────────────────────────────────────────────────────────────│
│                                                                 │
│  Карта: [____] [____] [____] [____]                          │
│  Срок: [MM/YY]  CVV: [___]                                  │
│                                                                 │
│  [   Оплатить   ]                                              │
│                                                                 │
│  🔒 Безопасная оплата. Данные не сохраняются.                 │
└─────────────────────────────────────────────────────────────────┘
4. Тестовая оплата
4.1. Тестовые карты
Тип	Номер	Срок	CVV
Успешная оплата	4242 4242 4242 4242	12/26	123
Отказ	4000 0000 0000 0002	12/26	123
Недостаточно средств	4000 0000 0000 0002	12/26	123
4.2. Платёжная система
MVP: Stripe (тестовый режим) или ЮKassa (тестовый режим)

PROD: Stripe / ЮKassa / CloudPayments

5. Лимиты в БД
typescript
interface UserLimits {
  userId: string;
  tier: 'free' | 'pro' | 'business';
  aiGenerationsToday: number;
  aiGenerationsLimit: number;
  gamesLimit: number;
  teamsLimit: number;
  analyticsLevel: 'basic' | 'advanced' | 'full';
  expiresAt: Date;
}
6. API Эндпоинты
Метод	URL	Описание
GET	/user/limits	Получить лимиты пользователя
POST	/user/upgrade	Обновить тариф
POST	/payment/create	Создать платёж
POST	/payment/confirm	Подтвердить платёж
GET	/payment/status	Статус платежа
7. React-компонент страницы /upgrade
tsx
// apps/web/src/app/upgrade/page.tsx
'use client';

import { useState } from 'react';

export default function UpgradePage() {
  const [selectedTier, setSelectedTier] = useState('pro');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [status, setStatus] = useState('idle');

  const handlePayment = async () => {
    setStatus('processing');
    // Имитация оплаты (тестовая)
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">💰 Монетизация</h1>
      
      {/* Тарифы */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="border rounded-xl p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold">Free</h3>
          <p className="text-2xl font-bold mt-2">0 ₽</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>3 генерации AI в день</li>
            <li>1 игра</li>
            <li>10 команд</li>
          </ul>
          <button className="mt-4 w-full py-2 border rounded-lg opacity-50 cursor-not-allowed">
            Текущий
          </button>
        </div>

        <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-xl font-bold text-blue-600">PRO</h3>
          <p className="text-2xl font-bold mt-2">990 ₽</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>50 генераций AI в день</li>
            <li>10 игр</li>
            <li>50 команд</li>
            <li>Расширенная аналитика</li>
          </ul>
          <button 
            onClick={() => setSelectedTier('pro')}
            className={`mt-4 w-full py-2 rounded-lg transition ${
              selectedTier === 'pro' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Выбрать
          </button>
        </div>

        <div className="border rounded-xl p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold">Business</h3>
          <p className="text-2xl font-bold mt-2">2990 ₽</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>500 генераций AI в день</li>
            <li>100 игр</li>
            <li>500 команд</li>
            <li>Полная аналитика</li>
          </ul>
          <button 
            onClick={() => setSelectedTier('business')}
            className={`mt-4 w-full py-2 rounded-lg transition ${
              selectedTier === 'business' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Выбрать
          </button>
        </div>
      </div>

      {/* Форма оплаты */}
      <div className="max-w-md mx-auto border rounded-xl p-6 bg-white dark:bg-gray-800 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">💳 Оплата</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Номер карты</label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Срок</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CVV</label>
              <input
                type="text"
                placeholder="123"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={status === 'processing'}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {status === 'processing' ? 'Обработка...' : 'Оплатить'}
          </button>

          {status === 'success' && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg">
              ✅ Оплата успешно проведена! Тариф PRO активирован.
            </div>
          )}

          <p className="text-xs text-center text-gray-500 mt-4">
            🔒 Безопасная оплата. Данные не сохраняются.
          </p>
        </div>
      </div>
    </div>
  );
}
8. Entitlements System (Система прав доступа после оплаты)
8.1. Сущность прав доступа
typescript
interface Entitlements {
  userId: string;
  tier: 'free' | 'pro' | 'business';
  features: {
    aiGenerationsLimit: number;
    maxGames: number;
    maxTeams: number;
    analyticsLevel: 'basic' | 'advanced' | 'full';
    marketplaceAccess: boolean;
    exportEnabled: boolean;
  };
  validUntil?: Date;
}
8.2. Правило применения
text
Платёж НЕ меняет тариф напрямую.
Платёж → обновляет entitlements → UI и API читают entitlements.
9. Billing Ledger (Финансовая книга)
9.1. Ledger запись
typescript
interface LedgerEntry {
  id: string;
  userId: string;
  type: 'payment' | 'refund' | 'payout' | 'commission' | 'adjustment';
  amount: number;
  currency: string;
  relatedId?: string;
  createdAt: Date;
}
9.2. Принцип
text
НИКОГДА не перезаписываем деньги. Только добавляем записи.
10. Refund System (Возвраты)
10.1. Причины возврата
typescript
enum RefundReason {
  USER_REQUEST = 'user_request',
  DUPLICATE_PAYMENT = 'duplicate',
  TECHNICAL_ERROR = 'technical_error',
  FRAUD = 'fraud',
}
10.2. Правила
text
Возврат:
→ создаёт отрицательную запись в Ledger
→ не удаляет платеж
→ не ломает аналитику
11. Payment Flow (Финальный поток оплаты)
text
1. User нажимает "Оплатить"
2. Создаётся Payment (pending)
3. Stripe/YooKassa возвращает success
4. Payment → paid
5. Ledger получает запись (payment)
6. Entitlements обновляются
7. UI обновляется
12. Subscription Auto-Renewal
text
PRO подписка:
каждые 30 дней:
→ создаётся новый payment
→ если успех → продление entitlements
→ если fail → PAST_DUE
13. Revenue Split Engine (распределение денег)
13.1. Модель
text
Платёж за сценарий = 1000 ₽
System: комиссия 30%
Автор: 70%
13.2. Ledger запись
text
+1000 ₽ → payment
-300 ₽ → platform_commission
+700 ₽ → author_balance
14. Author Payout Engine (выплаты авторам)
14.1. Минимальный вывод
text
1000 ₽
14.2. Процесс
text
1. Автор нажимает "Вывести"
2. Проверка balance
3. Создаётся payout (pending)
4. После Stripe Connect / YooKassa Payout → completed
5. Ledger фиксирует payout
15. Fraud & Abuse Protection
text
- лимит платежей/час
- лимит попыток оплаты
- проверка повторных карт
- блок подозрительных аккаунтов
16. Pricing Rules Engine (динамические цены)
text
if user.country == "corporate" → price = x1.5
if promoCode.active → price = price * discount
17. Финальный реальный поток системы
text
Payment → Ledger → Entitlements → Feature Access → UI / API gating
18. Что теперь изменилось
Было:
просто тарифы

просто /upgrade

просто оплата

Стало:
полноценная финансовая система

учёт денег (ledger)

права доступа (entitlements)

возвраты

автопродление

marketplace выплаты

19. Что делать Габену
text
Габен, задача по монетизации:

1. Создать страницу /upgrade с тарифами (как в примере выше).
2. Добавить тестовую оплату (имитация — пока без реального API).
3. Добавить визуальное отображение: какой тариф выбран, что происходит после оплаты.
4. Добавить проверку лимитов в AI-помощнике (привязать к тарифу).
5. Создать сущности Entitlements, Ledger, Payment в БД.

После этого — монетизация готова визуально. Реальный платёжник подключим позже.
20. Итоговый принцип
Платформа зарабатывает, когда авторы и организаторы зарабатывают.
AI-помощник — платный продукт.
Маркетплейс — комиссия.
Подписка — стабильный доход.
Ledger — учёт каждой копейки.

Дата: 24.06.2026
Статус: Утвержден
Класс: Продуктовый контракт (10/10)