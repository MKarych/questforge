# 📚 Навигатор по документации

> **Последнее обновление:** 25.06.2026  
> **Статус:** Актуальная версия

В этом файле — структурированный навигатор по всей документации проекта **«Город Приключений»**. Каждый документ пронумерован и сгруппирован по назначению.

---

## 🚀 Быстрый старт

| Для кого | С чего начать |
|----------|---------------|
| **Новый разработчик** | `01-vision-and-mission.md` → `SETUP.md` → `19-code-architecture.md` → `10-development-rules.md` |
| **Фронтенд-разработчик** | `09-ux-guidelines.md` → `05-api-specification.md` → `33-api-contracts.md` → `37-frontend-api-integration.md` |
| **Бэкенд-разработчик** | `28-system-architecture.md` → `26-domain-model.md` → `27-permissions-rbac.md` → `05-api-specification.md` |
| **Разработчик движка** | `04-execution-model.md` → `50-runtime-engine-spec.md` → `53-runtime-state-machine.md` |
| **Разработчик конструктора** | `49-scenario-editor-ultimate-spec.md` → `42-scenario-editor-ux.md` → `51-scenario-json-contract.md` |

---

## 🎯 Стратегия и видение

| Файл | Описание | Статус |
|------|----------|--------|
| [`01-vision-and-mission.md`](./01-vision-and-mission.md) | Миссия, видение и ключевые принципы проекта | ✅ Актуален |
| [`02-ecosystem-growth-strategy.md`](./02-ecosystem-growth-strategy.md) | Экосистема: роли, лестница роста, сетевой эффект | ✅ Актуален |
| [`03-platform-ecosystem-blueprint.md`](./03-platform-ecosystem-blueprint.md) | Платформа как бизнес: «Steam для мероприятий» | ✅ Актуален |

---

## 🏗️ Архитектура и ядро

| Файл | Описание | Статус |
|------|----------|--------|
| [`28-system-architecture.md`](./28-system-architecture.md) | Физическая архитектура: сервисы, инфраструктура, деплой | ✅ Актуален |
| [`26-domain-model.md`](./26-domain-model.md) | Доменная модель: все сущности системы и их связи | ✅ Актуален |
| [`27-permissions-rbac.md`](./27-permissions-rbac.md) | Роли и права доступа (RBAC): 5 ролей, политики | ✅ Актуален |
| [`04-execution-model.md`](./04-execution-model.md) | Ядро: Scenario → Engine → State, Event Sourcing, Orchestrator | ✅ Актуален |
| [`14-runtime-data-flow.md`](./14-runtime-data-flow.md) | Полный поток данных от клиента до Engine и обратно | ✅ Актуален |
| [`15-engine-determinism-contract.md`](./15-engine-determinism-contract.md) | Детерминизм движка: одинаковый вход → одинаковый выход | ✅ Актуален |
| [`16-error-model-and-recovery.md`](./16-error-model-and-recovery.md) | Обработка ошибок и восстановление системы | ✅ Актуален |
| [`17-state-replication-model.md`](./17-state-replication-model.md) | Распределённое состояние: Memory → Redis → PostgreSQL | ✅ Актуален |
| [`18-security-and-cheating-model.md`](./18-security-and-cheating-model.md) | Безопасность и защита от читерства | ✅ Актуален |

---

## 🗄️ База данных

| Файл | Описание | Статус |
|------|----------|--------|
| [`32-database-schema.md`](./32-database-schema.md) | Физическая модель PostgreSQL: таблицы, индексы, партиционирование | ✅ Основной |
| [`06-database-schema.md`](./06-database-schema.md) | Логическая модель БД + Prisma-схема | ⚠️ Частично дубль |
| [`13-versioning-and-migrations.md`](./13-versioning-and-migrations.md) | Версионирование сценариев и миграции | ✅ Актуален |

> **Примечание:** `06-database-schema.md` и `32-database-schema.md` описывают схему БД. `32-database-schema.md` — более полная версия (физическая модель с партиционированием). Рекомендуется использовать `32-database-schema.md`.

---

## 🔌 API

| Файл | Описание | Статус |
|------|----------|--------|
| [`05-api-specification.md`](./05-api-specification.md) | Полная спецификация REST API: все эндпоинты, методы, статус-коды | ✅ Актуален |
| [`33-api-contracts.md`](./33-api-contracts.md) | Типизированные контракты запросов и ответов | ✅ Актуален |
| [`37-frontend-api-integration.md`](./37-frontend-api-integration.md) | Фронтенд-интеграция: клиент, токены, ошибки | ⚠️ Частично устарел |

---

## 🎮 Игровой движок и механики

| Файл | Описание | Статус |
|------|----------|--------|
| [`50-runtime-engine-spec.md`](./50-runtime-engine-spec.md) | Runtime-движок: пошаговое выполнение сценария | ✅ Основной |
| [`53-runtime-state-machine.md`](./53-runtime-state-machine.md) | Машина состояний: жизненный цикл игры и команды | ✅ Основной |
| [`20-game-mechanics-spec.md`](./20-game-mechanics-spec.md) | Классификация всех игровых механик | ✅ Актуален |
| [`21-engine-mechanics-contracts.md`](./21-engine-mechanics-contracts.md) | JSON-контракты для каждой механики | ✅ Актуален |
| [`23-event-sourcing-spec.md`](./23-event-sourcing-spec.md) | Реестр событий системы и форматы | ✅ Актуален |
| [`34-state-model.md`](./34-state-model.md) | Полный автомат состояний (игра, команда, переходы) | ✅ Актуален |
| [`29-engine-runtime-spec.md`](./29-engine-runtime-spec.md) | Как движок исполняет сценарий | ⚠️ Частично дубль |
| [`22-engine-state-machine.md`](./22-engine-state-machine.md) | State Machine (старая версия) | ⚠️ Устарел |
| [`11-event-contract-spec.md`](./11-event-contract-spec.md) | Типизированный контракт событий | ⚠️ Частично дубль |
| [`07-game-engine-spec.md`](./07-game-engine-spec.md) | Детальная спецификация движка | ⚠️ Частично устарел |

---

## 🧩 Конструктор сценариев и JSON-контракт

| Файл | Описание | Статус |
|------|----------|--------|
| [`49-scenario-editor-ultimate-spec.md`](./49-scenario-editor-ultimate-spec.md) | Спецификация редактора сценариев (Ultimate) | ✅ Основной |
| [`42-scenario-editor-ux.md`](./42-scenario-editor-ux.md) | UX редактора: пользовательский опыт, дизайн | ✅ Актуален |
| [`43-scenario-editor-full-spec.md`](./43-scenario-editor-full-spec.md) | Полный план по редактору | ✅ Актуален |
| [`51-scenario-json-contract.md`](./51-scenario-json-contract.md) | JSON-контракт сценария: формат, валидация | ✅ Основной |
| [`12-scenario-validation-spec.md`](./12-scenario-validation-spec.md) | Валидация сценариев (правила проверки) | ✅ Актуален |
| [`24-scenario-json-schema.md`](./24-scenario-json-schema.md) | JSON-схема формата сценария | ⚠️ Частично дубль |
| [`30-builder-spec.md`](./30-builder-spec.md) | Визуальный редактор сценариев (Builder) | ⚠️ Устарел |
| [`31-validation-spec.md`](./31-validation-spec.md) | Правила проверки сценариев | ⚠️ Частично дубль |

---

## 🔌 Плагинная система

| Файл | Описание | Статус |
|------|----------|--------|
| [`54-plugin-system-spec.md`](./54-plugin-system-spec.md) | Плагинная архитектура: интерфейсы, регистрация, маркетплейс | ✅ Основной, обновлён |
| [`35-plugin-sdk-spec.md`](./35-plugin-sdk-spec.md) | SDK для разработчиков плагинов | ✅ Актуален |
| [`25-plugin-system-spec.md`](./25-plugin-system-spec.md) | Плагинная архитектура (старая версия) | ⚠️ Устарел |

---

## 👥 Основные модули

| Файл | Описание | Статус |
|------|----------|--------|
| [`45-user-profile-spec.md`](./45-user-profile-spec.md) | Профиль пользователя: данные, статистика, достижения | ✅ Актуален |
| [`46-team-module-spec.md`](./46-team-module-spec.md) | Модуль команд: создание, участники, рейтинг | ✅ Актуален |
| [`47-game-module-spec.md`](./47-game-module-spec.md) | Модуль игр: создание, каталог, модерация | ✅ Актуален |
| [`56-Auth-Module.md`](./56-Auth-Module.md) | Аутентификация: JWT, login/register, middleware | 📝 WIP |
| [`44-admin-moderation-spec.md`](./44-admin-moderation-spec.md) | Администрирование и модерация | ✅ Актуален |
| [`55-monetization-spec.md`](./55-monetization-spec.md) | Монетизация: покупки, роялти, комиссии | ✅ Актуален |
| [`48-main-page-and-header-spec.md`](./48-main-page-and-header-spec.md) | Главная страница и хедер | ✅ Актуален |

---

## 📱 Мобильный рантайм

| Файл | Описание | Статус |
|------|----------|--------|
| [`52-mobile-runtime-spec.md`](./52-mobile-runtime-spec.md) | Мобильный рантайм для игровых сессий | ✅ Актуален |

---

## 🛠️ Разработка и процессы

| Файл | Описание | Статус |
|------|----------|--------|
| [`10-development-rules.md`](./10-development-rules.md) | Правила разработки для разработчиков и AI-агентов | ✅ Актуален |
| [`19-code-architecture.md`](./19-code-architecture.md) | Структура проекта и файлов (монорепа) | ✅ Актуален |
| [`08-mvp-roadmap.md`](./08-mvp-roadmap.md) | План разработки MVP | ⚠️ Частично устарел |

---

## 📋 Отчёты и истории

| Файл | Описание | Статус |
|------|----------|--------|
| [`39-future-features.md`](./39-future-features.md) | Будущие функции и фичи | ✅ Актуален |
| [`41-platform-strategy.md`](./41-platform-strategy.md) | Стратегия платформы | ✅ Актуален |
| [`36-errors-fix-report.md`](./36-errors-fix-report.md) | Отчёт об исправлении ошибок | 📦 Архив |
| [`38-bug-report.md`](./38-bug-report.md) | Результаты тестирования Demo Environment | 📦 Архив |
| [`38-test-contract.md`](./38-test-contract.md) | Контракт тестирования | 📦 Архив |
| [`40-reverse-engineering-encounter.md`](./40-reverse-engineering-encounter.md) | Reverse Engineering Encounter | 📦 Архив |

---

## 🔧 Инструкции

| Файл | Описание | Статус |
|------|----------|--------|
| [`SETUP.md`](./SETUP.md) | Инструкция по установке и запуску проекта | ✅ Актуален |

---

## 📊 Сводка

| Категория | Всего | Актуальных | Устаревших/дублей |
|-----------|-------|------------|-------------------|
| Стратегия и видение | 3 | 3 | 0 |
| Архитектура и ядро | 9 | 9 | 0 |
| База данных | 3 | 1 | 2 (дубли) |
| API | 3 | 2 | 1 (частично устарел) |
| Игровой движок | 10 | 6 | 4 (дубли/устаревшие) |
| Конструктор сценариев | 8 | 5 | 3 (дубли/устаревшие) |
| Плагинная система | 3 | 2 | 1 (устарел) |
| Основные модули | 7 | 6 | 1 (WIP) |
| Мобильный рантайм | 1 | 1 | 0 |
| Разработка и процессы | 3 | 2 | 1 |
| Отчёты и истории | 6 | 2 | 4 (архив) |
| Инструкции | 1 | 1 | 0 |
| **Итого** | **54** | **39** | **15** |

---

## 🗂️ Рекомендации

### Дублирующиеся файлы — заменить основной версией

| Устаревший файл | Основной файл |
|----------------|---------------|
| `06-database-schema.md` | `32-database-schema.md` |
| `22-engine-state-machine.md` | `53-runtime-state-machine.md` |
| `25-plugin-system-spec.md` | `54-plugin-system-spec.md` |
| `29-engine-runtime-spec.md` | `50-runtime-engine-spec.md` |
| `30-builder-spec.md` | `49-scenario-editor-ultimate-spec.md` |
| `07-game-engine-spec.md` | `50-runtime-engine-spec.md` |

### Архив (исторические документы)

| Файл | Причина |
|------|---------|
| `36-errors-fix-report.md` | Отчёт об исправлениях, не несёт архитектурной ценности |
| `38-bug-report.md` | Отчёт по тестированию, историческая ценность |
| `38-test-contract.md` | Контракт тестирования |
| `40-reverse-engineering-encounter.md` | Исторический документ |