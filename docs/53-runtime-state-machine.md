```markdown
# 53. Runtime State Machine: Машина состояний сессии

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать состояния и переходы сессии игры.

---

## 1. Состояния сессии

```typescript
enum SessionStatus {
  CREATED = 'created', // Сессия создана, но не запущена
  RUNNING = 'running', // Активная игра
  PAUSED = 'paused', // На паузе
  FINISHED = 'finished', // Завершена
  CANCELLED = 'cancelled', // Отменена
  FAILED = 'failed', // Прервана ошибкой
}
2. Переходы
text
CREATED → RUNNING (start)
RUNNING → PAUSED (pause)
PAUSED → RUNNING (resume)
RUNNING → FINISHED (finish)
RUNNING → CANCELLED (cancel)
RUNNING → FAILED (error)
3. Запрещенные переходы
text
CREATED → FINISHED ❌
CREATED → CANCELLED ❌
CREATED → FAILED ❌
FINISHED → RUNNING ❌
FINISHED → PAUSED ❌
CANCELLED → RUNNING ❌
FAILED → RUNNING ❌
PAUSED → FINISHED ❌
PAUSED → CANCELLED ❌
PAUSED → FAILED ❌
4. Реализация
typescript
class SessionStateMachine {
  private transitions: Map<string, string[]> = new Map();

  constructor() {
    this.transitions.set('created', ['running']);
    this.transitions.set('running', ['paused', 'finished', 'cancelled', 'failed']);
    this.transitions.set('paused', ['running']);
    this.transitions.set('finished', []);
    this.transitions.set('cancelled', []);
    this.transitions.set('failed', []);
  }

  canTransition(from: SessionStatus, to: SessionStatus): boolean {
    return this.transitions.get(from)?.includes(to) ?? false;
  }

  transition(from: SessionStatus, to: SessionStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }
  }
}
5. События
Событие	Откуда	Куда	Описание
start	CREATED	RUNNING	Начало игры
pause	RUNNING	PAUSED	Пауза
resume	PAUSED	RUNNING	Продолжение
finish	RUNNING	FINISHED	Завершение
cancel	RUNNING	CANCELLED	Отмена
error	RUNNING	FAILED	Ошибка
Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)