> **Дата:** 27.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать все сценарии конфликтов в мультиплеерной игре и способы их разрешения.

---

## 1. Фундаментальные принципы
Сервер — единственный источник истины.

Все изменения проходят через оптимистичную блокировку.

Каждое действие имеет версию состояния.

Первый успешный ответ — канонический.

Все события упорядочены по времени.

Идемпотентность — обязательна.

Нет "призрачных" ответов из прошлого.

text

---

## 2. Stale State (Устаревшее состояние)

### 2.1. Проблема
Мария стоит у памятника.
Иван у следующей точки.
Мария отвечает правильно.
Иван уже видел следующее задание заранее и отправил ответ.

Вопрос: к какому состоянию относился ответ Ивана?

text

### 2.2. Решение: stateVersion

```typescript
interface AnswerCommand {
  commandId: string;
  teamId: string;
  nodeId: string;
  stateVersion: number; // ← Ключевое поле
  answer: string;
  userId: string;
}
2.3. Проверка
typescript
class ConflictResolver {
  validateAnswer(command: AnswerCommand, session: TeamSession) {
    if (command.stateVersion !== session.stateVersion) {
      return {
        status: 'stale',
        reason: 'STATE_VERSION_MISMATCH',
        currentVersion: session.stateVersion,
        message: 'Ваш ответ относится к устаревшему состоянию. Обновите страницу.',
      };
    }
    return { status: 'valid' };
  }
}
2.4. Правило
text
Любой ответ с неактуальным stateVersion отклоняется.
Клиент получает новое состояние и должен повторить действие.
3. Конфликт ответов
3.1. Решение
text
Первый успешно обработанный ответ становится каноническим.
Все остальные ответы на этот узел игнорируются.
typescript
class AnswerConflictResolver {
  resolve(answer: Answer, session: TeamSession) {
    if (session.currentNodeCompleted) {
      return {
        status: 'ignored',
        reason: 'NODE_ALREADY_RESOLVED',
      };
    }
    if (answer.stateVersion !== session.stateVersion) {
      return {
        status: 'stale',
        reason: 'STATE_VERSION_MISMATCH',
      };
    }
    return { status: 'accepted' };
  }
}
4. Конфликт подсказок
text
Подсказка списывается один раз за узел на всю команду.
Повторные запросы игнорируются.
5. Конфликт инвентаря
text
Инвентарь общий для команды.
Добавление предмета — атомарная операция.
6. Race Conditions (Гонки)
6.1. Решение: LockManager
typescript
class LockManager {
  async acquire(lockKey: string, ttl: number = 5000): Promise<boolean> {
    const acquired = await redis.set(lockKey, 'locked', 'NX', 'PX', ttl);
    return acquired === 'OK';
  }

  async release(lockKey: string): Promise<void> {
    await redis.del(lockKey);
  }
}
6.2. Использование
typescript
class TeamSessionService {
  async update(teamId: string, data: Partial<TeamSession>) {
    const lockKey = `lock:team:${teamId}`;
    const locked = await lockManager.acquire(lockKey);
    
    if (!locked) {
      throw new Error('TEAM_SESSION_LOCKED');
    }

    try {
      // 1. Загрузить текущее состояние
      // 2. Применить изменения
      // 3. Сохранить
      // 4. Увеличить stateVersion
    } finally {
      await lockManager.release(lockKey);
    }
  }
}
7. Таблица конфликтов
Сценарий	Механизм защиты
Два ответа одновременно	Первый канонический, остальные игнорируются
Ответ к устаревшему узлу	Проверка stateVersion
Две подсказки одновременно	Одна подсказка, остальные игнорируются
Два предмета одновременно	Атомарная операция + проверка наличия
Повторная отправка ответа	Idempotency Key
Переход между узлами и ответ	Проверка, что узел ещё активен
Разные инстансы Engine	LockManager (Redis)
Потеря соединения	Полная синхронизация при reconnect
8. Архитектурные правила
text
1. Все изменения проходят через LockManager.
2. stateVersion увеличивается при каждом изменении.
3. Ответы с неактуальным stateVersion отклоняются.
4. Первый ответ на узел — канонический.
5. Подсказка списывается один раз.
6. Инвентарь общий — атомарные операции.
7. Все события имеют sequence.
8. Все события идемпотентны.
9. При reconnect — полная синхронизация.
10. Клиент никогда не доверяет локальному состоянию.
9. Чек-лист для реализации
Добавить stateVersion в TeamSession

Добавить stateVersion в AnswerCommand

Реализовать проверку stateVersion

Реализовать LockManager

Добавить атомарные операции для инвентаря

Добавить sequence в события

Реализовать идемпотентность (Idempotency Key)

Добавить защиту от дублирующихся событий

Реализовать полную синхронизацию при reconnect

Добавить обработку "stale" ответов