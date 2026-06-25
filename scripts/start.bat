@echo off
REM ============================================================
REM QuestForge — Launch Script for Windows
REM ============================================================
REM Этот скрипт запускает всё одним нажатием:
REM   1. Поднимает Docker (PostgreSQL, Redis, MinIO)
REM   2. Устанавливает зависимости (если нужно)
REM   3. Создаёт миграцию Prisma и заполняет БД тестовыми данными
REM   4. Запускает API (бэкенд) на порту 3000
REM   5. Запускает Web (фронтенд) на порту 3001
REM
REM ✅ Доступ через локальную сеть:
REM   - http://localhost:3001 — на этом компьютере
REM   - http://<IP-адрес>:3001 — с телефона/планшета в той же Wi-Fi сети
REM ============================================================

@echo off
chcp 65001 >nul

setlocal enabledelayedexpansion

title QuestForge Launcher

echo ============================================
echo    QuestForge — Launch Script (Windows)
echo ============================================
echo.

REM ============================================================
REM Определяем IP-адрес
REM ============================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :ip_found
)
:ip_found
set LOCAL_IP=%LOCAL_IP: =%
if "%LOCAL_IP%"=="" set LOCAL_IP=127.0.0.1

echo [INFO] IP адрес устройства: %LOCAL_IP%
echo [INFO] С телефона заходи: http://%LOCAL_IP%:3001
echo.

REM ============================================================
REM 1. Проверка Docker
REM ============================================================
echo [1/6] Проверка Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker не запущен. Запусти Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker работает
echo.

REM ============================================================
REM 2. Запуск Docker контейнеров
REM ============================================================
echo [2/6] Запуск Docker контейнеров (PostgreSQL, Redis, MinIO)...
docker compose -f infrastructure/docker/docker-compose.yml up -d
if %errorlevel% neq 0 (
    docker-compose -f infrastructure/docker/docker-compose.yml up -d
)

REM Ждём PostgreSQL
echo Ожидание PostgreSQL...
:wait_postgres
docker exec questforge-postgres pg_isready -U questforge >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo [OK] PostgreSQL готов
echo [OK] Docker контейнеры запущены
echo.

REM ============================================================
REM 3. Установка зависимостей
REM ============================================================
echo [3/6] Проверка зависимостей...
if not exist "node_modules" (
    echo Установка npm зависимостей...
    call npm install
)
echo [OK] Зависимости установлены
echo.

REM ============================================================
REM 4. Prisma миграция + seed
REM ============================================================
echo [4/6] Prisma миграция и заполнение БД...

REM Генерируем Prisma Client
call npx prisma generate

REM Проверяем, есть ли миграции
dir prisma\migrations\*.sql >nul 2>&1
if %errorlevel% equ 0 (
    echo Миграции существуют, применяем...
    call npx prisma migrate deploy
) else (
    echo Создаём новую миграцию...
    call npx prisma migrate dev --name init --skip-seed
)

REM Заполняем тестовыми данными
echo Заполнение тестовыми данными...
call npx ts-node -r dotenv/config prisma/seed.ts dotenv_config_path=apps/api/.env

echo [OK] БД готова
echo.

REM ============================================================
REM 5. Запуск API (бэкенд)
REM ============================================================
echo [5/6] Запуск API (бэкенд) на порту 3000...

REM Убиваем старые процессы на портах
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="" (
        taskkill /f /pid %%a >nul 2>&1
    )
)

REM Запускаем API с CORS для всех origin (доступ с телефона/планшета)
cd apps\api
set CORS_ORIGIN=*
start "QuestForge-API" cmd /c "npx nest start --watch"
cd ..\..

REM Ждём запуск API
timeout /t 5 /nobreak >nul

echo [OK] API запущен на http://localhost:3000
echo [OK] API также доступен на http://%LOCAL_IP%:3000
echo.

REM ============================================================
REM 6. Запуск Web (фронтенд)
REM ============================================================
echo [6/6] Запуск Web (фронтенд) на порту 3001...

REM Запускаем Next.js с hostname 0.0.0.0 для доступа по сети
cd apps\web
start "QuestForge-Web" cmd /c "npx next dev -p 3001 -H 0.0.0.0"
cd ..\..

echo.
echo ============================================
echo [OK] ВСЁ ЗАПУЩЕНО!
echo ============================================
echo.
echo Локальный доступ:
echo   Сайт:       http://localhost:3001
echo   API:        http://localhost:3000
echo.
echo Доступ с других устройств (Wi-Fi):
echo   Сайт:       http://%LOCAL_IP%:3001
echo   API:        http://%LOCAL_IP%:3000
echo.
echo Тестовые пользователи (пароль: 123456):
echo   Админ:      admin@test.com
echo   Организатор: organizer@test.com
echo   Игрок:      player@test.com
echo.
echo ============================================
echo [INFO] Не закрывай это окно — в нём работают серверы.
echo [INFO] Нажми Ctrl+C для остановки всех процессов.
echo ============================================
echo.

REM Ожидаем
pause >nul

REM Остановка процессов
taskkill /f /im node.exe >nul 2>&1
echo Процессы остановлены.
pause