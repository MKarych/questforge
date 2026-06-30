import { BadRequestException } from '@nestjs/common';
import { $Enums } from '@prisma/client';

type GameStatus = $Enums.GameStatus;

// ============================================================
// Карта разрешённых переходов
// ============================================================
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['REGISTRATION_OPEN', 'CANCELLED', 'RESCHEDULED', 'DRAFT', 'RUNNING'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CANCELLED', 'RESCHEDULED', 'RUNNING'],
  REGISTRATION_CLOSED: ['LOBBY', 'CANCELLED', 'RESCHEDULED'],
  LOBBY: ['RUNNING', 'CANCELLED', 'RESCHEDULED'],
  RUNNING: ['FINISHED', 'CANCELLED'],
  FINISHED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  RESCHEDULED: ['PUBLISHED'],
  ARCHIVED: [],
  HIDDEN: ['PUBLISHED'],
  BLOCKED: [],
};

// ============================================================
// Запрещённые переходы
// ============================================================
const FORBIDDEN_TRANSITIONS: [string, string][] = [
  ['RUNNING', 'DRAFT'],
  ['RUNNING', 'PUBLISHED'],
  ['FINISHED', 'RUNNING'],
  ['FINISHED', 'PUBLISHED'],
  ['ARCHIVED', 'RUNNING'],
  ['ARCHIVED', 'PUBLISHED'],
  ['CANCELLED', 'RUNNING'],
  ['RESCHEDULED', 'RUNNING'],
];

/**
 * Проверяет, является ли переход разрешённым.
 * Если переход запрещён — выбрасывает BadRequestException.
 * Если переход не найден в списке разрешённых — тоже ошибка.
 */
export function validateTransition(currentStatus: GameStatus, targetStatus: GameStatus): void {
  const from = currentStatus as string;
  const to = targetStatus as string;

  // 1. Проверка по списку запрещённых
  const isForbidden = FORBIDDEN_TRANSITIONS.some(
    ([f, t]) => f === from && t === to,
  );
  if (isForbidden) {
    throw new BadRequestException({
      code: 'FORBIDDEN_STATUS_TRANSITION',
      message: `Переход из статуса ${currentStatus} в ${targetStatus} запрещён`,
    });
  }

  // 2. Проверка по списку разрешённых
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestException({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Переход из статуса ${currentStatus} в ${targetStatus} невозможен`,
    });
  }
}

/**
 * Проверяет, можно ли отменить игру из текущего статуса.
 * Отмена возможна из любого статуса, кроме FINISHED и ARCHIVED.
 */
export function canCancel(status: GameStatus): boolean {
  const s = status as string;
  return s !== 'FINISHED' && s !== 'ARCHIVED';
}

/**
 * Проверяет, можно ли перенести игру из текущего статуса.
 * Перенос возможен из PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, LOBBY.
 */
export function canReschedule(status: GameStatus): boolean {
  const s = status as string;
  return ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY'].includes(s);
}

/**
 * Возвращает список всех возможных целевых статусов из текущего.
 */
export function getAllowedTransitions(status: GameStatus): string[] {
  return ALLOWED_TRANSITIONS[status as string] ?? [];
}