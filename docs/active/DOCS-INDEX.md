# 📚 Навигатор по документации

> **Последнее обновление:** 25.06.2026  
> **Статус:** Актуальная версия
> **Структура:** `docs/active/`, `docs/archive/`, `docs/wip/`

В этом файле — структурированный навигатор по всей документации проекта **«Город Приключений»**. Документы разделены на три папки:

| Папка | Назначение |
|-------|------------|
| [`docs/active/`](./) | Актуальные документы, используемые в разработке |
| [`docs/wip/`](../wip/) | Документы в стадии разработки |
| [`docs/archive/`](../archive/) | Устаревшие файлы, заменённые на новые версии |

---

## 🚀 Быстрый старт

| Для кого | С чего начать |
|----------|---------------|
| **Новый разработчик** | [`01-vision-and-mission.md`](./01-vision-and-mission.md) → [`SETUP.md`](./SETUP.md) → [`19-code-architecture.md`](./19-code-architecture.md) → [`10-development-rules.md`](./10-development-rules.md) |
| **Фронтенд-разработчик** | [`09-ux-guidelines.md`](./09-ux-guidelines.md) → [`05-api-specification.md`](./05-api-specification.md) → [`33-api-contracts.md`](./33-api-contracts.md) → [`37-frontend-api-integration.md`](./37-frontend-api-integration.md) |
| **Бэкенд-разработчик** | [`28-system-architecture.md`](./28-system-architecture.md) → [`26-domain-model.md`](./26-domain-model.md) → [`27-permissions-rbac.md`](./27-permissions-rbac.md) → [`05-api-specification.md`](./05-api-specification.md) |
| **Разработчик движка** | [`04-execution-model.md`](./04-execution-model.md) → [`50-runtime-engine-spec.md`](./50-runtime-engine-spec.md) → [`53-runtime-state-machine.md`](./53-runtime-state-machine.md) |
| **Разработчик конструктора** | [`49-scenario-editor-ultimate-spec.md`](./49-scenario-editor-ultimate-spec.md) → [`42-scenario-editor-ux.md`](./42-scenario-editor-ux.md) → [`51-scenario-json-contract.md`](./51-scenario-json-contract.md) |

---

## 📁 Актуальные документы (`/docs/active/`)

### 🎯 Введение и стратегия

| Файл | Описание |
|------|----------|
| [`01-vision-and-mission.md`](./01-vision-and-mission.md) | Миссия, видение и ключевые принципы проекта |
| [`02-ecosystem-growth-strategy.md`](./02-ecosystem-growth-strategy.md) | Экосистема: роли, лестница роста, сетевой эффект |
| [`03-platform-ecosystem-blueprint.md`](./03-platform-ecosystem-blueprint.md) | Платформа как бизнес: «Steam для мероприятий» |

### 🏗️ Архитектура и ядро

| Файл | Описание |
|------|----------|
| [`28-system-architecture.md`](./28-system-architecture.md) | Физическая архитектура: сервисы, инфраструктура, деплой |
| [`26-domain-model.md`](./26-domain-model.md) | Доменная модель: все сущности системы и их связи |
| [`27-permissions-rbac.md`](./27-permissions-rbac.md) | Роли и права доступа (RBAC): 5 ролей, политики |
| [`04-execution-model.md`](./04-execution-model.md) | Ядро: Scenario → Engine → State, Event Sourcing, Orchestrator |
| [`14-runtime-data-flow.md`](./14-runtime-data-flow.md) | Полный поток данных от клиента до Engine и обратно |
| [`15-engine-determinism-contract.md`](./15-engine-determinism-contract.md) | Детерминизм движка: одинаковый вход → одинаковый выход |
| [`16-error-model-and-recovery.md`](./16-error-model-and-recovery.md) | Обработка ошибок и восстановление системы |
| [`17-state-replication-model.md`](./17-state-replication-model.md) | Распределённое состояние: Memory → Redis → PostgreSQL |
| [`18-security-and-cheating-model.md`](./18-security-and-cheating-model.md) | Безопасность и защита от читерства |

### 🗄️ База данных

| Файл | Описание |
|------|----------|
| [`32-database-schema.md`](./32-database-schema.md) | Физическая модель PostgreSQL: таблицы, индексы, партиционирование |
| [`13-versioning-and-migrations.md`](./13-versioning-and-migrations.md) | Версионирование сценариев и миграции |

> **Примечание:** [`06-database-schema.md`](../archive/06-database-schema.md) — устарел, заменён на `32-database-schema.md`.

### 🔌 API

| Файл | Описание |
|------|----------|
| [`05-api-specification.md`](./05-api-specification.md) | Полная спецификация REST API: все эндпоинты, методы, статус-коды |
| [`33-api-contracts.md`](./33-api-contracts.md) | Типизированные контракты запросов и ответов |
| [`37-frontend-api-integration.md`](./37-frontend-api-integration.md) | Фронтенд-интеграция: клиент, токены, ошибки |

### 🎮 Игровой движок и механики

| Файл | Описание |
|------|----------|
| [`50-runtime-engine-spec.md`](./50-runtime-engine-spec.md) | Runtime-движок: пошаговое выполнение сценария |
| [`53-runtime-state-machine.md`](./53-runtime-state-machine.md) | Машина состояний: жизненный цикл игры и команды |
| [`20-game-mechanics-spec.md`](./20-game-mechanics-spec.md) | Классификация всех игровых механик |
| [`21-engine-mechanics-contracts.md`](./21-engine-mechanics-contracts.md) | JSON-контракты для каждой механики |
| [`23-event-sourcing-spec.md`](./23-event-sourcing-spec.md) | Реестр событий системы и форматы |
| [`34-state-model.md`](./34-state-model.md) | Полный автомат состояний (игра, команда, переходы) |

> **Устаревшие:** [`07-game-engine-spec.md`](../archive/07-game-engine-spec.md), [`22-engine-state-machine.md`](../archive/22-engine-state-machine.md), [`29-engine-runtime-spec.md`](../archive/29-engine-runtime-spec.md)

### 🧩 Конструктор сценариев и JSON-контракт

| Файл | Описание |
|------|----------|
| [`49-scenario-editor-ultimate-spec.md`](./49-scenario-editor-ultimate-spec.md) | Спецификация редактора сценариев (Ultimate) |
| [`42-scenario-editor-ux.md`](./42-scenario-editor-ux.md) | UX редактора: пользовательский опыт, дизайн |
| [`43-scenario-editor-full-spec.md`](./43-scenario-editor-full-spec.md) | Полный план по редактору |
| [`51-scenario-json-contract.md`](./51-scenario-json-contract.md) | JSON-контракт сценария: формат, валидация |
| [`12-scenario-validation-spec.md`](./12-scenario-validation-spec.md) | Валидация сценариев (правила проверки) |
| [`24-scenario-json-schema.md`](./24-scenario-json-schema.md) | JSON-схема формата сценария |
| [`31-validation-spec.md`](./31-validation-spec.md) | Правила проверки сценариев (детально) |

> **Устаревшие:** [`30-builder-spec.md`](../archive/30-builder-spec.md)

### 🔌 Плагинная система

| Файл | Описание |
|------|----------|
| [`54-plugin-system-spec.md`](./54-plugin-system-spec.md) | Плагинная архитектура: интерфейсы, регистрация, маркетплейс |
| [`35-plugin-sdk-spec.md`](./35-plugin-sdk-spec.md) | SDK для разработчиков плагинов |

> **Устаревший:** [`25-plugin-system-spec.md`](../archive/25-plugin-system-spec.md)

### 👥 Основные модули

| Файл | Описание |
|------|----------|
| [`45-user-profile-spec.md`](./45-user-profile-spec.md) | Профиль пользователя: данные, статистика, достижения |
| [`46-team-module-spec.md`](./46-team-module-spec.md) | Модуль команд: создание, участники, рейтинг |
| [`47-game-module-spec.md`](./47-game-module-spec.md) | Модуль игр: создание, каталог, модерация |
| [`44-admin-moderation-spec.md`](./44-admin-moderation-spec.md) | Администрирование и модерация |
| [`55-monetization-spec.md`](./55-monetization-spec.md) | Монетизация: покупки, роялти, комиссии |
| [`48-main-page-and-header-spec.md`](./48-main-page-and-header-spec.md) | Главная страница и хедер |

### 📱 Мобильный рантайм

| Файл | Описание |
|------|----------|
| [`52-mobile-runtime-spec.md`](./52-mobile-runtime-spec.md) | Мобильный рантайм для игровых сессий |

### 🛠️ Разработка и процессы

| Файл | Описание |
|------|----------|
| [`10-development-rules.md`](./10-development-rules.md) | Правила разработки для разработчиков и AI-агентов |
| [`19-code-architecture.md`](./19-code-architecture.md) | Структура проекта и файлов (монорепа) |
| [`08-mvp-roadmap.md`](./08-mvp-roadmap.md) | План разработки MVP |

### 📋 Стратегия и будущее

| Файл | Описание |
|------|----------|
| [`39-future-features.md`](./39-future-features.md) | Будущие функции и фичи |
| [`41-platform-strategy.md`](./41-platform-strategy.md) | Стратегия платформы |

### 🔧 Инструкции

| Файл | Описание |
|------|----------|
| [`SETUP.md`](./SETUP.md) | Инструкция по установке и запуску проекта |

---

## 📝 В разработке (`/docs/wip/`)

| Файл | Описание |
|------|----------|
| [`56-Auth-Module.md`](../wip/56-Auth-Module.md) | Аутентификация: JWT, login/register, middleware |

---

## 📁 Архив (`/docs/archive/`) — DEPRECATED

Файлы в этой папке **устарели** и заменены на актуальные версии. Оставлены для исторической справки.

| Файл | Заменён на | Причина |
|------|------------|---------|
| [`06-database-schema.md`](./06-database-schema.md) | `32-database-schema.md` | Дублирует физическую модель БД |
| [`07-game-engine-spec.md`](./07-game-engine-spec.md) | `50-runtime-engine-spec.md` | Заменён на новую спецификацию движка |
| [`22-engine-state-machine.md`](./22-engine-state-machine.md) | `53-runtime-state-machine.md` | Заменён на новую машину состояний |
| [`25-plugin-system-spec.md`](./25-plugin-system-spec.md) | `54-plugin-system-spec.md` | Заменён на обновлённую плагинную систему |
| [`29-engine-runtime-spec.md`](./29-engine-runtime-spec.md) | `50-runtime-engine-spec.md` | Частично дублирует runtime engine |
| [`30-builder-spec.md`](./30-builder-spec.md) | `49-scenario-editor-ultimate-spec.md` | Заменён на редактор Ultimate |
| [`36-errors-fix-report.md`](./36-errors-fix-report.md) | — | Отчёт об исправлениях, исторический |
| [`38-bug-report.md`](./38-bug-report.md) | — | Отчёт по тестированию, исторический |
| [`38-test-contract.md`](./38-test-contract.md) | — | Контракт тестирования, исторический |
| [`40-reverse-engineering-encounter.md`](./40-reverse-engineering-encounter.md) | — | Reverse Engineering, исторический |