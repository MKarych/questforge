# Auth Module: Архитектурный контракт

> **Дата:** 25.06.2026  
> **Статус:** Утвержден  
> **Версия:** 2.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать домен аутентификации как часть платформы. Задать правила для всех сервисов и агентов.

---

## 1. Общие требования

### 1.1. Что должно работать

| Функция | Описание |
|---------|----------|
| **Регистрация** | Создание нового пользователя с уникальным логином и email |
| **Логин** | Вход как по **логину**, так и по **email** |
| **Согласие с политикой** | Обязательный чекбокс при регистрации |
| **Верификация почты** | Заложена в коде (отправка письма — заглушка) |
| **Капча** | Математическая (тестовая), не требует домена |

### 1.2. Технический стек

| Слой | Технология |
|------|------------|
| **Бэкенд** | NestJS, Prisma, PostgreSQL |
| **Фронтенд** | Next.js, React, Tailwind CSS |
| **Аутентификация** | JWT (JSON Web Token) |

---

## 2. База данных (Prisma Schema)

### 2.1. Добавить поля в модель `User`

| Поле | Тип | Описание |
|------|-----|----------|
| `username` | `String @unique` | Уникальный логин пользователя |
| `isEmailVerified` | `Boolean @default(false)` | Флаг подтверждения почты |
| `verificationToken` | `String @unique @optional` | Токен для верификации почты |

### 2.2. Миграция

```bash
npx prisma migrate dev --name add-auth-fields
npx prisma generate
3. Бэкенд (NestJS)
3.1. DTO
RegisterDto

Поле	Тип	Обязательное	Валидация
username	string	✅	min 3 символа, уникальный
email	string	✅	валидный email, уникальный
password	string	✅	min 6 символов
agreeToTerms	boolean	✅	должно быть true
captchaAnswer	string	❌	ответ на математическую капчу
LoginDto

Поле	Тип	Обязательное	Валидация
login	string	✅	может быть username или email
password	string	✅	проверяется по хешу
3.2. Логика регистрации
AuthService.register()

Проверить agreeToTerms — если false, вернуть ошибку

Проверить капчу (математическую)

Проверить уникальность username и email

Захешировать пароль (bcrypt)

Сгенерировать verificationToken (crypto.randomBytes)

Создать пользователя в БД

Отправить письмо с подтверждением (ЗАГЛУШКА) — пока просто логировать токен в консоль

Сгенерировать JWT токен

Вернуть AuthResponse

Ошибки:

Ситуация	HTTP	Сообщение
Нет согласия	400	"Вы должны согласиться с условиями использования"
Неверная капча	400	"Пожалуйста, решите капчу"
Email уже существует	409	"Пользователь с таким email уже существует"
Логин уже занят	409	"Этот логин уже занят"
3.3. Логика логина
AuthService.login()

Найти пользователя по login (поиск по username ИЛИ email)

Проверить пароль

(Опционально) Проверить, подтверждён ли email

Сгенерировать JWT

Вернуть AuthResponse

Ошибки:

Ситуация	HTTP	Сообщение
Пользователь не найден	401	"Неверный логин или пароль"
Неверный пароль	401	"Неверный логин или пароль"
Почта не подтверждена	401	"Подтвердите email перед входом" (можно пока отключить)
3.4. Верификация почты
AuthService.verifyEmail(token: string)

Найти пользователя по verificationToken

Если не найден — ошибка

Установить isEmailVerified = true

Очистить verificationToken

Вернуть сообщение об успехе

Эндпоинт: GET /auth/verify-email?token=...

3.5. Эндпоинты API
Метод	URL	Описание	Тело запроса
POST	/auth/register	Регистрация	RegisterDto
POST	/auth/login	Логин	LoginDto
GET	/auth/verify-email	Подтверждение почты	?token=...
GET	/auth/me	Текущий пользователь (JWT)	—
POST	/auth/logout	Выход	—
4. Фронтенд (Next.js)
4.1. Страница регистрации (/auth/register)
Поля формы:

Поле	Тип	Обязательное
Логин	text	✅
Email	email	✅
Пароль	password	✅
Согласие с политикой	checkbox	✅
Капча	number (ответ на пример)	✅
Поведение:

Чекбокс "Согласие с политикой" — обязателен для отправки формы

Капча — генерируется случайный пример X + Y = ?, при ошибке — обновляется

При успешной регистрации — сохраняется JWT, редирект на /dashboard

При ошибке — показывается сообщение, капча обновляется

Чекбокс согласия:

text
☐ Я соглашаюсь с Условиями использования и даю согласие на обработку персональных данных согласно Политике конфиденциальности.
Ссылки на страницы пока ведут на # (заглушки).

4.2. Страница логина (/auth/login)
Поля формы:

Поле	Тип	Обязательное
Логин или Email	text	✅
Пароль	password	✅
Поведение:

Поле login принимает как username, так и email

При успешном входе — сохраняется JWT, редирект на /dashboard

При ошибке — показывается сообщение

4.3. API прокси (Next.js API Routes)
Маршрут	Проксирует
/api/auth/register	POST /auth/register
/api/auth/login	POST /auth/login
5. Капча (тестовая)
Тип: Математическая

Логика:

При загрузке страницы генерируются два случайных числа (1–10)

Пользователь вводит их сумму

Проверка выполняется на фронтенде и на бэкенде

При ошибке — генерируется новый пример

Почему: Не требует домена, работает сразу, защищает от ботов на 80%.

В будущем: Заменить на Cloudflare Turnstile или Google reCAPTCHA при наличии домена.

6. Верификация почты (заглушка)
Текущее состояние: Отправка письма не реализована.

Что заложено:

При регистрации генерируется verificationToken

Токен сохраняется в БД

В консоль выводится ссылка для подтверждения

Эндпоинт /auth/verify-email готов к обработке

Пример вывода в консоль:

text
🔑 Токен верификации для user@example.com: a1b2c3d4e5f6...
🔗 Ссылка для подтверждения: http://localhost:3001/auth/verify-email?token=a1b2c3d4e5f6...
TODO: Подключить реальный сервис отправки писем (Nodemailer, SendGrid, Resend и т.д.).

7. Переменные окружения
Переменная	Описание	Пример
NEXT_PUBLIC_API_URL	URL бэкенда	http://localhost:3000
JWT_SECRET	Секрет для подписи JWT	your-secret-key
JWT_EXPIRES_IN	Время жизни JWT	7d
DATABASE_URL	Подключение к PostgreSQL	postgresql://...
8. Чек-лист для разработчика
Бэкенд
Обновить prisma/schema.prisma (добавить username, isEmailVerified, verificationToken)

Создать и применить миграцию

Создать RegisterDto и LoginDto

Обновить AuthService (регистрация, логин, верификация)

Обновить AuthController (новые эндпоинты)

Проверить, что JWT Guard работает

Написать тесты (по желанию)

Фронтенд
Обновить страницу регистрации (добавить чекбокс и капчу)

Обновить страницу логина (поле login вместо email)

Создать API прокси (/api/auth/register, /api/auth/login)

Настроить редиректы после регистрации/логина

Добавить обработку ошибок и валидацию форм

Тестирование
Проверить регистрацию с уникальными логином и email

Проверить, что одинаковый логин или email не проходят

Проверить логин как по логину, так и по email

Проверить капчу (неправильный ответ → ошибка)

Проверить чекбокс (без согласия → ошибка)

Проверить верификацию почты (по токену)

9. Архитектурные связи
Компонент	Связан с
AuthService	PrismaService (БД), JwtService (токены)
AuthController	AuthService
RegisterDto	Валидация на бэкенде
Страница регистрации	POST /api/auth/register
Страница логина	POST /api/auth/login
10. JWT Contract
10.1. Payload токена
typescript
interface JwtPayload {
  sub: string; // userId
  username: string;
  email: string;
  role: UserRole;
}
10.2. Время жизни
text
Access Token: 7 дней (MVP)

В будущем:
- Access Token: 15 минут
- Refresh Token: 30 дней
10.3. Заголовок авторизации
http
Authorization: Bearer <token>
11. User Response Contract
Чтобы фронт и бэк не спорили.

11.1. UserDto
typescript
interface UserDto {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  role: UserRole;
  createdAt: string;
}
11.2. AuthResponse
typescript
interface AuthResponse {
  user: UserDto;
  accessToken: string;
}
12. Security Rules
12.1. Пароли
text
Пароли никогда не хранятся в открытом виде.

Алгоритм:
bcrypt

Rounds:
10
12.2. Ограничение попыток входа
text
Не более 5 попыток входа за 15 минут.

После превышения:
HTTP 429
"Слишком много попыток входа. Попробуйте позже."
12.3. Блокировка брутфорса
text
- По IP
- По email
- По username
12.4. Логи безопасности
typescript
interface AuthLog {
  id: string;
  userId?: string;
  action: 'register' | 'login_success' | 'login_failed' | 'logout' | 'verify_email';
  ip: string;
  userAgent: string;
  createdAt: Date;
}
13. Roles System
Роли уже реализованы и работают в проекте. Здесь они фиксируются как часть контракта.

13. Roles System

Роли **уже реализованы и работают** в проекте. Здесь они фиксируются как часть контракта.

13.1. Роли

```typescript
enum UserRole {
  PLAYER = 'PLAYER',           // Только играет
  ORGANIZER = 'ORGANIZER',     // Создаёт игры и сценарии (гибридная роль)
  MODERATOR = 'MODERATOR',     // Модерирует контент
  ADMIN = 'ADMIN',             // Полный доступ
}
13.2. Права
Роль	Возможности
PLAYER	Играть, создавать команды, оставлять отзывы
ORGANIZER	Всё, что у PLAYER + создавать игры + создавать и продавать сценарии
MODERATOR	Всё, что у ORGANIZER + модерировать игры, сценарии и заявки
ADMIN	Полный доступ ко всему (пользователи, деньги, настройки)
13.3. Логика выдачи ролей
text
1. При регистрации → PLAYER
2. После одобрения заявки → ORGANIZER
3. Назначается только через админку → MODERATOR / ADMIN


14. Session Management
14.1. Хранение токена
text
MVP:
localStorage

Production:
httpOnly Cookie
14.2. Выход
http
POST /auth/logout
Действия:

text
- Удалить токен на клиенте
- Очистить состояние пользователя
- Перенаправить на /auth/login
14.3. Получение текущего пользователя
http
GET /auth/me
Ответ:

typescript
{
  user: UserDto;
}
15. Архитектурные правила
Контракт для разработчиков
text
1. Email и username уникальны.

2. Логин работает через username ИЛИ email.

3. Все пароли хранятся только в виде bcrypt hash.

4. JWT подписывается только через JWT_SECRET.

5. Все защищенные эндпоинты используют JWT Guard.

6. Почта может быть неподтвержденной в MVP.

7. Капча обязательна только для регистрации.

8. Все ошибки возвращаются в едином формате.

9. AuthService — единственная точка работы с пользователями.

10. Frontend никогда не валидирует безопасность без проверки на сервере.
16. Error Response Contract
16.1. Формат ошибки
typescript
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
16.2. Примеры
json
{
  "statusCode": 409,
  "message": "Этот логин уже занят",
  "error": "Conflict"
}
json
{
  "statusCode": 401,
  "message": "Неверный логин или пароль",
  "error": "Unauthorized"
}
json
{
  "statusCode": 429,
  "message": "Слишком много попыток входа. Попробуйте позже.",
  "error": "Too Many Requests"
}
Дата: 25.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)