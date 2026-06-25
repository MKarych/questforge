# 🏙️ Город Приключений

> **Создавай. Играй. Зарабатывай.**  
> Платформа для городских игр и интерактивных мероприятий нового поколения.

[![GitHub](https://img.shields.io/badge/GitHub-mkarych/questforge-blue?style=flat-square&logo=github)](https://github.com/mkarych/questforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-blue?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-24-blue?style=flat-square&logo=docker)](https://www.docker.com/)

---

## 🚀 Что это?

**Город Приключений** — это не просто очередной конструктор квестов. 

Это **экосистема**, где каждый может:
- 🎮 **Играть** — находить и проходить городские игры
- ✍️ **Создавать** — придумывать сценарии без единой строчки кода
- 💰 **Зарабатывать** — продавать свои сценарии другим организаторам

> **Метафора:** "Steam для мероприятий" / "Unreal Engine для городских приключений"

---

## 🎯 Для кого?

| 👤 Игроки | ✍️ Авторы | 🎯 Организаторы |
| :--- | :--- | :--- |
| Находят игры в каталоге | Создают сценарии в конструкторе | Покупают готовые сценарии |
| Собирают команды | Зарабатывают роялти | Проводят игры |
| Проходят квесты | Развивают репутацию | Зарабатывают на билетах |

---

## ⚡ Ключевые фичи

### 🧩 Конструктор сценариев
- Визуальный редактор как в Figma (React Flow)
- 11 типов заданий: текст, код, фото, GPS, QR, выбор, таймер, NPC
- Drag-and-drop, соединения, валидация в реальном времени

### ⏱️ Игровой процесс
- Таймер с круговым прогрессом
- 3 уровня подсказок (лёгкая → полная)
- Очки +10 / штрафы -2, -5, -10
- Экран финиша со статистикой

### 👥 Команды
- Создание команд
- Приглашение участников
- Рейтинг команд

### 👤 Профили
- Аватарки, статистика игр
- Система достижений
- Рейтинг и репутация

### 🛡️ Роли и модерация
- 5 ролей: PLAYER, AUTHOR, ORGANIZER, ADMIN, MODERATOR
- Онбординг организаторов через заявки
- Автоматическое повышение ролей

---

## 🛠️ Технологический стек

| Слой | Технологии |
| :--- | :--- |
| **Backend** | NestJS, TypeScript, Prisma |
| **Frontend** | Next.js, React, Tailwind CSS |
| **База данных** | PostgreSQL, Redis |
| **Хранилище** | MinIO / S3 |
| **Инфраструктура** | Docker, Docker Compose |

---

## 🚀 Быстрый старт

### 📦 Предварительные требования

- Node.js (v20+)
- Docker Desktop
- Git

### ⚡ Запуск

#### 🖥️ Рекомендуемый способ: Скрипты запуска

Проект содержит готовые скрипты для автоматического запуска **всего стека одной кнопкой**:

| ОС | Файл | Описание |
|----|------|----------|
| **Windows** | [`scripts/start.bat`](./scripts/start.bat) | Автоматический запуск Docker, миграций, API и Frontend |
| **macOS / Linux** | [`scripts/start.sh`](./scripts/start.sh) | Аналогичный скрипт для Unix-систем (с цветным выводом) |

**Что делает скрипт:**
1. Проверяет Docker и запускает контейнеры (PostgreSQL, Redis, MinIO)
2. Устанавливает npm-зависимости (если не установлены)
3. Применяет Prisma-миграции и заполняет БД тестовыми данными
4. Запускает API (порт 3000) и Frontend (порт 3001) в отдельных окнах
5. Показывает IP-адрес для доступа с телефона/планшета по Wi-Fi

**Запуск:**
```bash
# Windows (двойной клик по start.bat ИЛИ в PowerShell)
.\scripts\start.bat

# macOS / Linux (в терминале)
chmod +x scripts/start.sh
./scripts/start.sh
```

#### 📝 Ручной запуск (для продвинутых)

```bash
# 1. Клонировать
git clone https://github.com/mkarych/questforge.git
cd questforge

# 2. Установить зависимости
npm install

# 3. Настроить .env
cp .env.example .env

# 4. Запустить инфраструктуру
npm run docker:up

# 5. Накатить миграции
npm run db:migrate

# 6. Запустить всё (API + Frontend)
npm run dev
```

**После запуска:**
- API: http://localhost:3000
- Frontend: http://localhost:3001

📖 **Подробная инструкция:** [docs/SETUP.md](./docs/SETUP.md)

---

## 📁 Документация

Вся документация в папке [`/docs`](./docs/).

**Начните здесь:**
- [📚 Навигатор по документации](./docs/active/DOCS-INDEX.md) — полный структурированный список всех документов
- [⚙️ Установка и запуск](./docs/active/SETUP.md) — локальный запуск проекта
- [🛡️ Правила разработки](./docs/active/10-development-rules.md) — для разработчиков и AI-агентов

**Ключевые документы:**
- [🏗️ Архитектура](./docs/active/28-system-architecture.md)
- [🗄️ Схема БД](./docs/active/32-database-schema.md)
- [🔌 API спецификация](./docs/active/05-api-specification.md)
- [🎮 Игровой движок](./docs/active/50-runtime-engine-spec.md)
- [🧩 Конструктор сценариев](./docs/active/49-scenario-editor-ultimate-spec.md)
- [👥 Основные модули](./docs/active/45-user-profile-spec.md), [Команды](./docs/active/46-team-module-spec.md), [Игры](./docs/active/47-game-module-spec.md)
- [📱 Мобильный рантайм](./docs/active/52-mobile-runtime-spec.md)

---

## 🤝 Команда

**Karych Team** © 2026

---

## 📄 Лицензия

MIT © 2026 Karych Team
