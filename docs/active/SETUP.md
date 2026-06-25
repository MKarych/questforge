```markdown
# Установка и запуск Adventure Engine

> Полное руководство по установке проекта на MacOS и Windows.

---

## 🚀 Быстрый старт (рекомендуется)

Если вы хотите запустить проект **одной кнопкой** — используйте готовые скрипты:

| ОС | Файл | Описание |
|----|------|----------|
| **Windows** | [`scripts/start.bat`](../../scripts/start.bat) | Автоматический запуск Docker, миграций, API и Frontend |
| **macOS / Linux** | [`scripts/start.sh`](../../scripts/start.sh) | Аналогичный скрипт (с цветным выводом) |

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

---

## 📦 Что нужно установить заранее (для любой ОС)

| Программа | Зачем | Где скачать |
| :--- | :--- | :--- |
| **Node.js** (v20 или выше) | Для запуска сервера и фронтенда | [nodejs.org](https://nodejs.org/) |
| **Docker Desktop** | Для PostgreSQL, Redis и MinIO | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Для клонирования репозитория | [git-scm.com](https://git-scm.com/) |
| **VS Code** (опционально) | Для удобной работы с кодом | [code.visualstudio.com](https://code.visualstudio.com/) |

---

## 🍏 MacOS (Intel / Apple Silicon)

### 1️⃣ Установка необходимых программ

Если у тебя нет Homebrew — установи его:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Установи всё необходимое:
```bash
brew install node git docker
```

### 2️⃣ Клонирование проекта
```bash
git clone https://github.com/mkarych/questforge.git
cd questforge
```

### 3️⃣ Установка зависимостей
```bash
npm install
```

### 4️⃣ Настройка переменных окружения
```bash
cp .env.example .env
```
Открой файл `.env` и проверь, что там есть:
```env
DATABASE_URL="postgresql://questforge:questforge123@localhost:5432/questforge"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-change-me"
```

### 5️⃣ Запуск Docker (PostgreSQL, Redis, MinIO)
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

Проверь, что контейнеры запустились:
```bash
docker ps
```
Должно быть три контейнера: `questforge-postgres`, `questforge-redis`, `questforge-minio`.

### 6️⃣ Создание базы данных (миграции Prisma)
```bash
npx prisma migrate dev --name init
```

Если ошибка `DATABASE_URL not found`, передай переменную вручную:
```bash
export DATABASE_URL="postgresql://questforge:questforge123@localhost:5432/questforge"
npx prisma migrate dev --name init
```

### 7️⃣ Запуск бэкенда
Открой **первый терминал**:
```bash
cd apps/api
npm run dev
```
Должно появиться: `🚀 API запущен на http://localhost:3000`

### 8️⃣ Запуск фронтенда
Открой **второй терминал**:
```bash
cd apps/web
npm run dev
```
Должно появиться: `ready - started server on 0.0.0.0:3001`

### 9️⃣ Проверка
- Открой в браузере: **`http://localhost:3000/api`** — должен быть JSON-ответ.
- Открой в браузере: **`http://localhost:3001`** — должна открыться главная страница.

---

## 🪟 Windows (PowerShell)

### 1️⃣ Установка необходимых программ

**Git:**
```powershell
winget install --id Git.Git -e --source winget
```

**Node.js:**
```powershell
winget install OpenJS.NodeJS
```

**Docker Desktop:**
Скачай с официального сайта: [docker.com](https://www.docker.com/products/docker-desktop/)  
После установки — запусти Docker Desktop и дождись зелёного индикатора.

### 2️⃣ Клонирование проекта
```powershell
cd C:\Users\%USERNAME%
git clone https://github.com/mkarych/questforge.git
cd questforge
```

### 3️⃣ Установка зависимостей
```powershell
npm install
```

### 4️⃣ Настройка переменных окружения
```powershell
copy .env.example .env
```
Открой файл `.env` и проверь:
```env
DATABASE_URL="postgresql://questforge:questforge123@localhost:5432/questforge"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key-change-me"
```

### 5️⃣ Запуск Docker (PostgreSQL, Redis, MinIO)
```powershell
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

Проверь:
```powershell
docker ps
```

### 6️⃣ Создание базы данных (миграции Prisma)
```powershell
npx prisma migrate dev --name init
```

Если ошибка `DATABASE_URL not found`, передай переменную вручную:
```powershell
$env:DATABASE_URL="postgresql://questforge:questforge123@localhost:5432/questforge"
npx prisma migrate dev --name init
```

### 7️⃣ Запуск бэкенда
Открой **первый терминал** (PowerShell):
```powershell
cd apps/api
npm run dev
```

### 8️⃣ Запуск фронтенда
Открой **второй терминал**:
```powershell
cd apps/web
npm run dev
```

### 9️⃣ Проверка
- `http://localhost:3000/api` — бэкенд
- `http://localhost:3001` — фронтенд

---

## 🔥 Запуск одной командой (Windows PowerShell)

Если хочешь запустить всё сразу (бэкенд + фронтенд + Docker):
```powershell
cd C:\questforge\questforge; docker-compose -f infrastructure/docker/docker-compose.yml up -d; cd apps/api; Start-Process cmd -ArgumentList "/k npm run dev"; cd ../web; Start-Process cmd -ArgumentList "/k npm run dev"
```

---

## 🛑 Остановка проекта

1. Останови сервера: нажми `Ctrl+C` в каждом терминале.
2. Останови Docker контейнеры:
```bash
docker-compose -f infrastructure/docker/docker-compose.yml down
```

---

## 🐛 Частые ошибки и их решение

| Проблема | Решение |
| :--- | :--- |
| **Ошибка `Command not found: npm`** | Node.js не установлен. Установи с [nodejs.org](https://nodejs.org/) |
| **Ошибка `Command not found: docker`** | Docker не установлен или не запущен. Запусти Docker Desktop. |
| **Ошибка `Prisma: DATABASE_URL not found`** | Передай переменную вручную (см. шаг 6). |
| **Ошибка `EADDRINUSE: address already in use`** | Порт 3000 или 3001 занят. Найди и убей процесс или перезагрузи ПК. |
| **Ошибка `Git not found` (Windows)** | Установи Git через `winget install Git.Git` или скачай с сайта. |
| **Ошибка `WSL not installed` (Docker на Windows)** | Установи WSL2: `wsl --install` и перезагрузи ПК. |

---

## 📌 Если ничего не помогает

1. **Перезагрузи компьютер** — это решает 90% проблем с Docker и портами.
2. **Удали `node_modules` и установи заново:**
   ```bash
   rm -rf node_modules
   npm install
   ```
3. **Сбрось базу данных:**
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml down
   docker volume rm questforge_postgres_data
   docker-compose -f infrastructure/docker/docker-compose.yml up -d
   npx prisma migrate dev --name init
   ```
4. **Напиши мне** — я помогу. 🚀

---

## 🚀 После установки

- Бэкенд: http://localhost:3000
- Фронтенд: http://localhost:3001
- Prisma Studio: http://localhost:5555 (для просмотра БД)

---

**Удачи!** 🎉
```