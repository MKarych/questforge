markdown
# 61. Commerce Module Spec: Маркетплейс, лицензирование и коммерческий движок

> **Дата:** 27.06.2026  
> **Статус:** Утвержден  
> **Версия:** 2.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать модель коммерческого движка платформы — маркетплейс, лицензирование, платежи, выплаты и интеграцию с игровым движком.

---

## 1. Фундаментальные принципы

**Commerce Module — это ядро монетизации платформы.**

```text
Сценарий работает ТОЛЬКО внутри платформы.
Лицензия — это ключ доступа к запуску.
Без лицензии — никакого запуска.
Зачем это нужно?

text
1. Защита от пиратства — сценарий нельзя скачать и украсть
2. Контроль использования — мы знаем, сколько раз запущен сценарий
3. Модель SaaS — подписки, лицензии, расширения
4. Данные для авторов — сколько реальных запусков
5. Простота для организатора — купил и сразу запускаешь, ничего не настраивая
2. Архитектура Commerce Module
text
┌─────────────────────────────────────────────────────────────────┐
│                    COMMERCE MODULE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   MARKETPLACE   │  │   LICENSING     │  │    PAYMENTS     │ │
│  │   (витрина)     │  │   (ядро)        │  │   (оплата)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PAYOUTS       │  │   REVIEWS       │  │   PROMOTIONS    │ │
│  │   (выплаты)     │  │   (отзывы)      │  │   (продвижение) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
3. License Engine (Ядро лицензирования)
3.1. Принцип работы
text
canUserLaunchScenario(userId, listingId)
  ↓
1. Найти активную лицензию
2. Проверить, не истекла ли она
3. Проверить, не превышен ли лимит запусков
4. Проверить, не отозвана ли лицензия
5. Проверить, доступна ли версия сценария
  ↓
✅ allowed: true / ❌ allowed: false + reason
3.2. LicenseValidationResult
typescript
interface LicenseValidationResult {
  allowed: boolean;
  reason?: string;              // 'NO_LICENSE' | 'EXPIRED' | 'LIMIT_EXCEEDED' | 'REVOKED' | 'VERSION_UNAVAILABLE'
  licenseId?: string;
  licenseType?: string;
  remainingActivations?: number;
  expiresAt?: Date;
}
3.3. LicenseStatus
typescript
enum LicenseStatus {
  ACTIVE = 'ACTIVE',           // Можно использовать
  REVOKED = 'REVOKED',         // Отозвана (chargeback, мошенничество)
  EXPIRED = 'EXPIRED',         // Истек срок
  SUSPENDED = 'SUSPENDED',     // Приостановлена (спор)
}
3.4. LicenseEngineService
typescript
class LicenseEngineService {
  // Проверка возможности запуска
  async validateLicense(userId: string, listingId: string, versionId: string): Promise<LicenseValidationResult> {
    // 1. Найти активную лицензию
    const license = await this.prisma.userLicense.findFirst({
      where: {
        userId,
        listingId,
        status: LicenseStatus.ACTIVE,
      },
    });

    if (!license) {
      return { allowed: false, reason: 'NO_LICENSE' };
    }

    // 2. Проверить срок действия
    if (license.expiresAt && license.expiresAt < new Date()) {
      return { allowed: false, reason: 'EXPIRED' };
    }

    // 3. Проверить лимит запусков
    if (license.activationsLimit > 0 && license.activationsUsed >= license.activationsLimit) {
      return { allowed: false, reason: 'LIMIT_EXCEEDED' };
    }

    // 4. Проверить, что версия доступна
    const version = await this.prisma.scenarioVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.status !== 'PUBLISHED') {
      return { allowed: false, reason: 'VERSION_UNAVAILABLE' };
    }

    // 5. Всё хорошо
    return {
      allowed: true,
      licenseId: license.id,
      licenseType: license.licenseType,
      remainingActivations: license.activationsLimit - license.activationsUsed,
      expiresAt: license.expiresAt,
    };
  }

  // Зафиксировать запуск
  async recordRun(userId: string, listingId: string, versionId: string): Promise<void> {
    // 1. Найти лицензию
    const license = await this.prisma.userLicense.findFirst({
      where: {
        userId,
        listingId,
        status: LicenseStatus.ACTIVE,
      },
    });

    if (!license) {
      throw new Error('No active license found');
    }

    // 2. Проверить лимит
    if (license.activationsLimit > 0 && license.activationsUsed >= license.activationsLimit) {
      throw new Error('License limit exceeded');
    }

    // 3. Увеличить счётчик запусков
    await this.prisma.userLicense.update({
      where: { id: license.id },
      data: {
        activationsUsed: { increment: 1 },
      },
    });

    // 4. Создать запись о запуске
    await this.prisma.scenarioRun.create({
      data: {
        scenarioId: versionId,
        organizerId: userId,
        licenseId: license.id,
        startedAt: new Date(),
      },
    });
  }
}
4. Модель данных (обновлённая)
4.1. UserLicense (Активная лицензия)
typescript
interface UserLicense {
  id: string;
  userId: string;
  listingId: string;
  scenarioVersionId: string;    // ← Версия, на которую куплена лицензия
  licenseType: string;          // single, multi_city, commercial, white_label
  status: LicenseStatus;        // ACTIVE, REVOKED, EXPIRED, SUSPENDED
  activationsUsed: number;      // Использовано запусков
  activationsLimit: number;     // Лимит запусков (0 = ∞)
  expiresAt?: Date;             // Срок действия (если есть)
  updatePolicy: UpdatePolicy;   // Политика обновлений
  purchasedAt: Date;
  revokedAt?: Date;
  revokedReason?: string;       // chargeback, fraud, refund
  createdAt: Date;
  updatedAt: Date;
}
4.2. ScenarioRun (Запуск сценария)
typescript
interface ScenarioRun {
  id: string;
  scenarioId: string;           // ID версии сценария
  organizerId: string;          // Организатор, который запустил
  licenseId: string;            // Лицензия, по которой запустили
  gameId?: string;              // ID игры, если запуск через игру
  startedAt: Date;
  endedAt?: Date;               // Когда завершился запуск
  status: 'RUNNING' | 'COMPLETED' | 'ABORTED';
  createdAt: Date;
}
4.3. Purchase (Покупка) — снапшот на момент покупки
typescript
interface Purchase {
  id: string;
  listingId: string;
  scenarioVersionId: string;    // ← Привязка к версии
  buyerId: string;              // Организатор

  // Снапшот на момент покупки
  listingSnapshotTitle: string;
  listingSnapshotVersion: string;
  listingSnapshotPrice: number;

  licenseType: string;          // Тип лицензии
  price: number;                // Цена покупки
  commission: number;           // Комиссия платформы
  royalty: number;              // Роялти автору
  status: PurchaseStatus;
  paymentId: string;            // ID платежа
  createdAt: Date;
}
4.4. Payout (Выплата автору)
typescript
interface Payout {
  id: string;
  authorId: string;
  amount: number;               // Сумма выплаты
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paymentId?: string;           // ID платежа в платёжной системе
  failedReason?: string;
  processedAt?: Date;
  createdAt: Date;
}
4.5. MarketplaceAnalytics (Аналитика)
typescript
interface MarketplaceAnalytics {
  listingId: string;
  views: number;                // Просмотры
  favorites: number;            // В избранном
  sales: number;                // Продажи
  conversionRate: number;       // sales / views
  avgRating: number;            // Средний рейтинг
  reviewsCount: number;         // Количество отзывов
  period: 'DAY' | 'WEEK' | 'MONTH';
  date: Date;
}
4.6. Остальные модели (из предыдущей версии)
MarketplaceListing

LicenseType

FavoriteListing

Cart / CartItem

PromoCode

ScenarioVersion

AuthorEarning (связана с Purchase и Payout)

5. Лицензии и запуски
5.1. Что считается запуском?
text
Организатор создал игру
↓
Привязал сценарий
↓
Запустил игру
↓
Это считается 1 запуском
5.2. Лимиты по типам лицензий
Тип лицензии	Лимит запусков	Обновления	Срок
Single	1	Исправления в версии	Бессрочно
Multi City	∞	12 месяцев	12 месяцев
Commercial	∞	Бессрочно	Бессрочно
White Label	∞	Индивидуально	Индивидуально
5.3. Отзыв лицензии
typescript
enum RevocationReason {
  CHARGEBACK = 'chargeback',
  FRAUD = 'fraud',
  REFUND = 'refund',
  VIOLATION = 'violation',
  SUPPORT = 'support',
}
6. Вывод средств
6.1. Процесс
text
1. Автор накапливает доход → AuthorEarning (PENDING)
2. Автор запрашивает выплату → Payout (PENDING)
3. Админ проверяет и подтверждает → Payout (PROCESSING)
4. Платёжная система переводит деньги → Payout (PAID)
6.2. Минимальная сумма
text
1000 ₽
6.3. Период выплат
text
Ежемесячно (до 15 числа)
7. Маркетплейс: аналитика
7.1. Для автора
text
Просмотры страницы сценария
Количество добавлений в избранное
Конверсия: продажи / просмотры
Средний рейтинг
Количество отзывов
Доход
7.2. Для платформы
text
Общее количество продаж
Общий доход платформы
Самые продаваемые сценарии
Категории-лидеры
Пиковые периоды продаж
8. Интеграция с игровым движком
8.1. Запуск сценария
text
Организатор создаёт игру
  ↓
Выбирает сценарий из "Моих сценариев" (купленных)
  ↓
Запускает игру
  ↓
Engine перед запуском проверяет лицензию → LicenseEngineService.validateLicense()
  ↓
✅ Если лицензия активна → игра запускается
❌ Если нет → ошибка "Для запуска этого сценария требуется лицензия"
8.2. Связь с игрой
typescript
// При создании игры
interface Game {
  // ... существующие поля
  scenarioLicenseId?: string;   // ID лицензии, по которой запущен сценарий
  scenarioRunId?: string;       // ID запуска
}
9. Платежи
9.1. Платёжные системы
text
MVP: Stripe / ЮKassa
PROD: Stripe / ЮKassa / CloudPayments
9.2. Тестовые карты
Тип	Номер	Срок	CVV
Успешная оплата	4242 4242 4242 4242	12/26	123
Отказ	4000 0000 0000 0002	12/26	123
10. Архитектурные правила
text
1. Commerce Module — отдельный модуль.
2. License Engine — ядро коммерции.
3. Без лицензии — нет запуска сценария.
4. Лицензия всегда привязана к версии сценария.
5. Покупка хранит снапшот (цена, название).
6. Автор не может изменить версию, которая уже куплена.
7. Актив нельзя скачать — только запустить внутри платформы.
8. Каждый запуск логируется (ScenarioRun).
9. Доход автора рассчитывается после подтверждения оплаты.
10. Выплата — отдельный процесс.
11. Лицензию можно отозвать (chargeback, мошенничество).
12. Аналитика помогает авторам улучшать сценарии.
13. Маркетплейс — витрина над коммерческим движком.
14. Всё логируется для аудита.
11. API Эндпоинты
11.1. License Engine
Метод	URL	Описание
GET	/license/validate/:listingId	Проверить, есть ли лицензия у пользователя
GET	/license/status/:listingId	Статус лицензии пользователя
GET	/license/me	Список моих лицензий
11.2. Маркетплейс (публичные)
Метод	URL	Описание
GET	/marketplace	Список активов
GET	/marketplace/:id	Детали актива
GET	/marketplace/categories	Категории
GET	/marketplace/types	Типы активов
11.3. Маркетплейс (автор)
Метод	URL	Описание
POST	/marketplace	Выложить актив
PATCH	/marketplace/:id	Обновить актив
POST	/marketplace/:id/publish	Отправить на модерацию
GET	/marketplace/me/listings	Мои активы
GET	/marketplace/me/sales	Мои продажи
GET	/marketplace/me/earnings	Мои доходы
GET	/marketplace/me/analytics	Аналитика по моим активам
11.4. Маркетплейс (покупатель)
Метод	URL	Описание
POST	/marketplace/:id/purchase	Купить лицензию
POST	/marketplace/:id/favorite	В избранное
DELETE	/marketplace/:id/favorite	Удалить из избранного
GET	/marketplace/cart	Корзина
POST	/marketplace/cart	Добавить в корзину
DELETE	/marketplace/cart/:itemId	Удалить из корзины
POST	/marketplace/cart/checkout	Оформить корзину
POST	/marketplace/promo/validate	Проверить промокод
POST	/marketplace/:id/review	Оставить отзыв
GET	/marketplace/me/purchases	Мои покупки
GET	/marketplace/me/licenses	Мои лицензии
11.5. Выплаты
Метод	URL	Описание
POST	/payout/request	Запросить выплату
GET	/payout/history	История выплат
GET	/payout/balance	Текущий баланс автора
11.6. Админ
Метод	URL	Описание
GET	/admin/marketplace/pending	Активы на модерации
POST	/admin/marketplace/:id/approve	Одобрить
POST	/admin/marketplace/:id/reject	Отклонить
POST	/admin/marketplace/:id/block	Заблокировать
POST	/admin/marketplace/:id/unblock	Разблокировать
DELETE	/admin/marketplace/:id	Удалить актив
POST	/admin/marketplace/promo	Создать промокод
DELETE	/admin/marketplace/promo/:id	Удалить промокод
GET	/admin/marketplace/stats	Статистика маркетплейса
GET	/admin/payouts/pending	Выплаты на подтверждение
PATCH	/admin/payouts/:id/process	Подтвердить выплату
POST	/admin/payouts/:id/revoke	Отозвать выплату
POST	/admin/license/:id/revoke	Отозвать лицензию
12. Приоритет разработки
text
1. Auth (добить полностью) ✅
2. Roles & Permissions ✅
3. Scenario Builder ✅
4. Scenario Runtime ✅
5. Commerce Core (Purchase + License) ← МЫ ЗДЕСЬ
6. Marketplace UI
7. Payments
8. Reviews
9. Payouts
10. Promotions
11. Analytics
Дата: 27.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)