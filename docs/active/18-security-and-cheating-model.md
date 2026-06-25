```markdown
# Security and Cheating Model: Защита платформы

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Server-Authoritative
> **Frontend — никогда не доверяем.**

Вся логика проверки (правильность ответа, таймеры, переходы) выполняется только в Engine. Клиент отправляет только сырые данные.

### 1.2. Все команды подписываются
Каждая команда от клиента подписывается HMAC, чтобы предотвратить подмену.

### 1.3. Rate Limiting
Ограничение количества запросов от одного клиента/сессии.

### 1.4. Anti-Replay
Каждое событие обрабатывается один раз. Повторные события игнорируются.

### 1.5. Минимальный сбор данных
Собираем только данные, необходимые для работы системы.

---

## 2. Аутентификация и авторизация

### 2.1. JWT токены

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: 'organizer' | 'author' | 'admin';
  expiresIn: number;
}
```

**Сроки жизни:**
- Access token: 7 дней
- Refresh token: 30 дней

### 2.2. Проверка прав

```typescript
class AuthGuard {
  // Проверка: является ли пользователь организатором игры
  async isOrganizer(userId: string, gameId: string): Promise<boolean> {
    const game = await this.db.games.findUnique({
      where: { id: gameId }
    });
    return game.organizerId === userId;
  }

  // Проверка: имеет ли пользователь доступ к сессии
  async canAccessSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.db.sessions.findUnique({
      where: { id: sessionId },
      include: { team: { include: { members: true } } }
    });
    return session.team.members.some(m => m.userId === userId);
  }

  // Проверка: является ли пользователь автором сценария
  async isAuthor(userId: string, scenarioId: string): Promise<boolean> {
    const scenario = await this.db.scenarios.findUnique({
      where: { id: scenarioId }
    });
    return scenario.authorId === userId;
  }
}
```

### 2.3. Роли

| Роль | Доступ |
| :--- | :--- |
| **Игрок (неавторизованный)** | Прохождение игры, отправка ответов |
| **Игрок (авторизованный)** | Профиль, история игр, команды |
| **Организатор** | Создание игр, управление сессиями, проверка ответов |
| **Автор** | Создание сценариев, публикация на маркетплейсе |
| **Администратор** | Управление пользователями, модерация, статистика |

---

## 3. Server-Authoritative (Клиент не доверяется)

### 3.1. Принцип

> **Клиент отправляет только команды. Engine решает, что правильно.**

```text
1. Клиент отправляет PLAYER_ANSWER с ответом "12345"
   ↓
2. Engine проверяет: правильный ли ответ?
   ↓
3. Engine решает: success или fail
   ↓
4. Engine обновляет состояние и отправляет клиенту
```

### 3.2. Что НЕ доверяется клиенту

| Что НЕ доверяется | Почему |
| :--- | :--- |
| `isCorrect` | Клиент может сказать "я ответил правильно" |
| `score` | Клиент может прибавить себе очки |
| `currentNodeId` | Клиент может перепрыгнуть на финиш |
| `timestamp` | Клиент может подменить время |
| `location` (GPS) | Клиент может подменить координаты |

### 3.3. Реализация

```typescript
// ❌ ПЛОХО — доверяем клиенту
class GameService {
  handleAnswer(answer: string, isCorrect: boolean) {
    if (isCorrect) { // ❌ Доверяем клиенту
      this.score += 10;
    }
  }
}

// ✅ ХОРОШО — проверяем на сервере
class RulesEngine {
  evaluate(node: Node, event: PlayerEvent): TransitionType {
    // Вся логика на сервере
    if (event.answer === node.answer) {
      return 'success';
    }
    return 'fail';
  }
}
```

---

## 4. Event Signing (Подпись команд)

### 4.1. Принцип

Каждая команда от клиента подписывается HMAC, чтобы предотвратить подмену данных в транзите.

```typescript
class EventSigner {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Подписать событие
  sign(event: PlayerCommand): SignedEvent {
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${event.id}:${event.type}:${JSON.stringify(event.payload)}`)
      .digest('hex');

    return {
      ...event,
      signature
    };
  }

  // Проверить подпись
  verify(signedEvent: SignedEvent): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${signedEvent.id}:${signedEvent.type}:${JSON.stringify(signedEvent.payload)}`)
      .digest('hex');

    return signedEvent.signature === expectedSignature;
  }
}
```

### 4.2. Использование

```typescript
// Клиент подписывает команду перед отправкой
const signedEvent = eventSigner.sign({
  id: 'evt-001',
  type: 'PLAYER_ANSWER',
  payload: { nodeId: 'node-1', answer: '12345' }
});

// Сервер проверяет подпись
if (!eventSigner.verify(signedEvent)) {
  throw new InvalidSignatureError('Event signature is invalid');
}
```

---

## 5. Rate Limiting (Защита от спама)

### 5.1. Лимиты

| Лимит | Период | Действие |
| :--- | :--- | :--- |
| 10 ответов | 1 минута | Заблокировать на 10 секунд |
| 50 ответов | 1 час | Заблокировать на 1 час |
| 5 подсказок | Игра | Отключить подсказки |
| 100 команд | Сессия | Заблокировать сессию |

### 5.2. Реализация

```typescript
class RateLimiter {
  constructor(private redis: RedisClient) {}

  async check(sessionId: string, action: string, limit: number, period: number): Promise<boolean> {
    const key = `rate:${sessionId}:${action}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, period);
    }
    
    if (count > limit) {
      return false; // Превышен лимит
    }
    
    return true; // Лимит не превышен
  }
}

// Использование
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand): Promise<Result> {
    // Проверка rate limiting
    const allowed = await this.rateLimiter.check(
      sessionId,
      'answers',
      10, // 10 ответов
      60  // за 60 секунд
    );
    
    if (!allowed) {
      throw new RateLimitError('Too many answers. Please wait.');
    }
    
    // ... остальная логика
  }
}
```

---

## 6. Anti-Replay (Защита от повторных событий)

### 6.1. Принцип

> **Каждое событие обрабатывается один раз.**

```typescript
class AntiReplay {
  constructor(private redis: RedisClient) {}

  // Проверить, было ли событие уже обработано
  async isProcessed(eventId: string): Promise<boolean> {
    const key = `replay:${eventId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  // Отметить событие как обработанное
  async markProcessed(eventId: string): Promise<void> {
    const key = `replay:${eventId}`;
    await this.redis.set(key, '1', 'EX', 86400); // TTL 24 часа
  }
}
```

### 6.2. Использование

```typescript
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand): Promise<Result> {
    // 1. Проверка anti-replay
    if (await this.antiReplay.isProcessed(event.id)) {
      return { status: 'ignored', message: 'Duplicate event' };
    }

    try {
      // 2. Обработка события
      const result = await this.processEventInternal(sessionId, event);
      
      // 3. Отметить как обработанное
      await this.antiReplay.markProcessed(event.id);
      
      return result;
    } catch (error) {
      // При ошибке не отмечаем как обработанное (можно повторить)
      throw error;
    }
  }
}
```

---

## 7. Анти-чит (Обнаружение подозрительного поведения)

### 7.1. Подозрительное поведение

| Поведение | Действие |
| :--- | :--- |
| Слишком быстрые ответы (< 1 сек) | Запросить CAPTCHA |
| Все ответы правильные (100% accuracy) | Проверить на бота |
| Огромное количество команд (флуд) | Rate limiting |
| Подмена координат (GPS) | Проверить расстояние между точками |
| Мультиаккаунты | Блокировка по IP |

### 7.2. Реализация

```typescript
class CheatDetector {
  constructor(private redis: RedisClient) {}

  // Проверка времени ответа
  async checkResponseTime(sessionId: string, nodeId: string): Promise<boolean> {
    const key = `response:${sessionId}:${nodeId}`;
    const lastResponse = await this.redis.get(key);
    
    if (lastResponse) {
      const timeSince = Date.now() - parseInt(lastResponse);
      if (timeSince < 1000) { // Меньше 1 секунды
        // Подозрительно быстро
        return false;
      }
    }
    
    await this.redis.set(key, Date.now().toString(), 'EX', 3600);
    return true;
  }

  // Проверка accuracy (процент правильных ответов)
  async checkAccuracy(sessionId: string): Promise<boolean> {
    const stats = await this.getSessionStats(sessionId);
    const accuracy = stats.correct / (stats.correct + stats.wrong);
    
    if (accuracy > 0.95) { // > 95% правильных ответов
      // Подозрительно высокий процент
      return false;
    }
    
    return true;
  }

  // Проверка GPS (слишком большое расстояние между точками)
  async checkGpsDistance(
    sessionId: string,
    currentNode: Node,
    event: PlayerEvent
  ): Promise<boolean> {
    const lastLocation = await this.getLastLocation(sessionId);
    
    if (lastLocation) {
      const distance = this.calculateDistance(
        lastLocation.lat,
        lastLocation.lng,
        event.metadata.lat,
        event.metadata.lng
      );
      
      if (distance > 5000) { // > 5 км
        // Подозрительно большое расстояние
        return false;
      }
    }
    
    await this.saveLocation(sessionId, event.metadata);
    return true;
  }
}
```

---

## 8. Шифрование

### 8.1. Данные в транзите (TLS/HTTPS)

```text
Все соединения используют HTTPS (REST API) и WSS (WebSocket).
```

### 8.2. Данные в покое (База данных)

| Данные | Шифрование |
| :--- | :--- |
| Пароли | bcrypt (соль 10) |
| JWT токены | HS256 или RS256 |
| Персональные данные | AES-256 |
| Платежная информация | Не храним, используем сторонние сервисы |

```typescript
class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private secret: Buffer;

  constructor(secret: string) {
    this.secret = crypto.scryptSync(secret, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secret, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secret, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  }
}
```

---

## 9. Примеры

### 9.1. Правильная защита

```typescript
// ✅ ПРАВИЛЬНО — полная защита
class EngineOrchestrator {
  async processEvent(sessionId: string, event: SignedEvent): Promise<Result> {
    // 1. Проверка подписи
    if (!this.eventSigner.verify(event)) {
      throw new InvalidSignatureError();
    }

    // 2. Проверка rate limiting
    if (!await this.rateLimiter.check(sessionId, 'answers', 10, 60)) {
      throw new RateLimitError();
    }

    // 3. Проверка anti-replay
    if (await this.antiReplay.isProcessed(event.id)) {
      return { status: 'ignored' };
    }

    // 4. Авторизация
    if (!await this.authGuard.canAccessSession(event.userId, sessionId)) {
      throw new ForbiddenError();
    }

    // 5. Обработка события (вся логика на сервере)
    const result = await this.processEventInternal(sessionId, event);

    // 6. Отметить как обработанное
    await this.antiReplay.markProcessed(event.id);

    return result;
  }
}
```

### 9.2. Неправильная защита

```typescript
// ❌ ПЛОХО — нет проверок
class EngineOrchestrator {
  async processEvent(sessionId: string, event: any): Promise<any> {
    // ❌ Нет проверки подписи
    // ❌ Нет rate limiting
    // ❌ Нет anti-replay
    // ❌ Нет авторизации
    
    // ❌ Доверяем данным от клиента
    if (event.payload.isCorrect) {
      // ...
    }
    
    return this.processEventInternal(sessionId, event);
  }
}
```

---

## 10. Аудит безопасности

### 10.1. Логирование подозрительных действий

```typescript
class SecurityAudit {
  constructor(private logger: Logger) {}

  logSuspiciousAction(action: string, context: any): void {
    this.logger.warn({
      type: 'security_audit',
      action,
      context,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityEvent(event: string, context: any): void {
    this.logger.info({
      type: 'security_event',
      event,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 10.2. Метрики безопасности

| Метрика | Описание |
| :--- | :--- |
| `rate_limit_hits` | Количество превышений rate limit |
| `invalid_signatures` | Количество невалидных подписей |
| `replay_attempts` | Количество попыток повторных событий |
| `blocked_ips` | Количество заблокированных IP |
| `cheat_detections` | Количество обнаруженных читов |

---

## 11. Итоговый контракт

> **Frontend не доверяется.**
>
> **Все команды подписываются (HMAC).**
>
> **Rate limiting защищает от спама.**
>
> **Каждое событие обрабатывается один раз.**
>
> **Анти-чит — обязателен.**
>
> **Все данные шифруются.**
>
> **Аудит безопасности — обязателен.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Безопасность — это не опция, это обязательство.*
```