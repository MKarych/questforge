#!/bin/bash
# ============================================================
# QuestForge — Launch Script for macOS / Linux
# ============================================================
# Этот скрипт запускает всё одним нажатием:
#   1. Поднимает Docker (PostgreSQL, Redis, MinIO)
#   2. Устанавливает зависимости (если нужно)
#   3. Создаёт миграцию Prisma и заполняет БД тестовыми данными
#   4. Запускает API (бэкенд) на порту 3000
#   5. Запускает Web (фронтенд) на порту 3001
#
# ✅ Доступ через локальную сеть:
#   - http://localhost:3001 — на этом компьютере
#   - http://<IP-адрес>:3001 — с телефона/планшета в той же Wi-Fi сети
# ============================================================

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   QuestForge — Launch Script (macOS/Linux)${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Определяем IP-адрес устройства в локальной сети
get_local_ip() {
  if command -v ipconfig &> /dev/null; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
  elif command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
  else
    LOCAL_IP="127.0.0.1"
  fi
  echo "$LOCAL_IP"
}

LOCAL_IP=$(get_local_ip)
echo -e "${GREEN}🌐 IP адрес устройства: ${LOCAL_IP}${NC}"
echo -e "${GREEN}📱 С телефона заходи: http://${LOCAL_IP}:3001${NC}"
echo ""

# CORS: * = разрешаем запросы с любого IP (для доступа с телефона/планшета)
# В режиме разработки это безопасно
CORS_ORIGIN="*"
echo -e "${GREEN}🔒 CORS: разрешены все origin (режим разработки)${NC}"
echo ""

# ============================================================
# 1. Проверка Docker
# ============================================================
echo -e "${YELLOW}[1/6] Проверка Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo "❌ Docker не найден. Установи Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "❌ Docker daemon не запущен. Запусти Docker Desktop."
  exit 1
fi
echo -e "${GREEN}✅ Docker OK${NC}"

# ============================================================
# 2. Запуск Docker контейнеров
# ============================================================
echo -e "${YELLOW}[2/6] Запуск Docker контейнеров (PostgreSQL, Redis, MinIO)...${NC}"
docker compose -f infrastructure/docker/docker-compose.yml up -d 2>/dev/null || \
  docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Ждём, пока PostgreSQL будет готов
echo "⏳ Ожидание PostgreSQL..."
for i in {1..30}; do
  if docker exec questforge-postgres pg_isready -U questforge &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL готов${NC}"
    break
  fi
  sleep 1
done

echo -e "${GREEN}✅ Docker контейнеры запущены${NC}"

# ============================================================
# 3. Установка зависимостей (если нужно)
# ============================================================
echo -e "${YELLOW}[3/6] Проверка зависимостей...${NC}"
if [ ! -d "node_modules" ]; then
  echo "📦 Установка npm зависимостей..."
  npm install
fi
echo -e "${GREEN}✅ Зависимости OK${NC}"

# ============================================================
# 4. Prisma миграция + seed
# ============================================================
echo -e "${YELLOW}[4/6] Prisma миграция и заполнение БД...${NC}"

# Генерируем Prisma Client
npx prisma generate

# Если миграция уже есть — просто применяем
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null | grep -v migration_lock.toml)" ]; then
  echo "📋 Миграции уже существуют, применяем..."
  npx prisma migrate deploy
else
  echo "📋 Создаём новую миграцию..."
  npx prisma migrate dev --name init --skip-seed
fi

# Заполняем тестовыми данными
echo "🌱 Заполнение тестовыми данными..."
npx ts-node -r dotenv/config prisma/seed.ts dotenv_config_path=apps/api/.env

echo -e "${GREEN}✅ БД готова${NC}"

# ============================================================
# 5. Запуск API (бэкенд)
# ============================================================
echo -e "${YELLOW}[5/6] Запуск API (бэкенд) на порту 3000...${NC}"

# Убиваем старые процессы на портах 3000 и 3001
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true

# Запускаем API с CORS для localhost и IP устройства
cd apps/api
CORS_ORIGIN="$CORS_ORIGIN" npx nest start --watch &
API_PID=$!
cd "$PROJECT_DIR"

# Ждём запуск API
sleep 5

echo -e "${GREEN}✅ API запущен на http://localhost:3000${NC}"
echo -e "${GREEN}✅ API также доступен на http://${LOCAL_IP}:3000${NC}"

# ============================================================
# 6. Запуск Web (фронтенд)
# ============================================================
echo -e "${YELLOW}[6/6] Запуск Web (фронтенд) на порту 3001...${NC}"

# Запускаем Next.js с hostname 0.0.0.0 для доступа по сети
cd apps/web
npx next dev -p 3001 -H 0.0.0.0 &
WEB_PID=$!
cd "$PROJECT_DIR"

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}✅ ВСЁ ЗАПУЩЕНО!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "📌 Локальный доступ:"
echo -e "   🌐 Сайт:       ${GREEN}http://localhost:3001${NC}"
echo -e "   ⚙️  API:        ${GREEN}http://localhost:3000${NC}"
echo -e "   🗄️  Prisma Studio: ${GREEN}npx prisma studio${NC}"
echo ""
echo -e "📌 Доступ с других устройств (Wi-Fi):"
echo -e "   🌐 Сайт:       ${GREEN}http://${LOCAL_IP}:3001${NC}"
echo -e "   ⚙️  API:        ${GREEN}http://${LOCAL_IP}:3000${NC}"
echo ""
echo -e "📌 Тестовые пользователи (пароль: 123456):"
echo -e "   👑 Админ:      ${GREEN}admin@test.com${NC}"
echo -e "   🎮 Организатор: ${GREEN}organizer@test.com${NC}"
echo -e "   🎯 Игрок:      ${GREEN}player@test.com${NC}"
echo ""
echo -e "${YELLOW}Нажми Ctrl+C для остановки всех процессов${NC}"
echo ""

# Ожидаем завершения процессов
trap "kill $API_PID $WEB_PID 2>/dev/null; echo 'Процессы остановлены'" EXIT
wait