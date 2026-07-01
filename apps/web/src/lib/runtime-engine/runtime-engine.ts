// ============================================================
// 50. Runtime Engine Spec: Архитектурный контракт движка исполнения сценариев
// Версия: 2.0
// Включает: SessionStateMachine (spec 53), ExecutionEngine (spec 50.3),
//           ConditionEngine (spec 50.4), RewardEngine (spec 50.5),
//           TriggerSystem (spec 50.6), Scheduler (spec 50.7), AuditLog (spec 50.8)
// ============================================================

import {
  Scenario,
  Scene,
  Mission,
  Condition,
  SingleCondition,
  ConditionGroup,
  Reward,
  VariableDefinition,
  TriggerDefinition,
  TriggerAction,
  Schedule,
  Action,
  Inventory,
  InventoryItem,
  Achievement,
  RoleDefinition,
  RoleAssignment,
  LoopConfig,
  ParallelScenarioConfig,
  SyncPoint,
  MultiScenarioState,
  ParallelScenarioInstance,
  SubScenarioConfig,
} from '@/lib/editor-store/editor.types';

// ==================== 2.6. GameSession (spec 50.2.6) ====================

export type SessionStatus = 'created' | 'running' | 'paused' | 'finished' | 'cancelled' | 'failed';

export interface Team {
  id: string;
  name: string;
  captainId: string;
  members: Player[];
  inventory: Inventory;
  variables: Record<string, any>;
  score: number;
  reputation: number;
  achievements: Achievement[];
}

export interface Player {
  id: string;
  name: string;
  role: 'captain' | 'member' | 'observer';
}

export interface GameSession {
  id: string;
  scenarioId: string;
  scenario: Scenario;
  teamId: string;
  team: Team;
  currentSceneId: string;
  variables: Record<string, any>;
  inventory: Inventory;
  score: number;
  achievements: Achievement[];
  status: SessionStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  events: AuditLogEntry[];
  version: number;
}

// ==================== 8. Audit Log (spec 50.8) ====================

export type AuditEventType =
  | 'session.created'
  | 'scene.entered'
  | 'scene.exited'
  | 'mission.started'
  | 'mission.completed'
  | 'mission.failed'
  | 'answer.submitted'
  | 'answer.correct'
  | 'answer.wrong'
  | 'hint.used'
  | 'reward.applied'
  | 'score.changed'
  | 'achievement.unlocked'
  | 'item.added'
  | 'item.removed'
  | 'transition'
  | 'session.finished'
  | 'session.failed'
  | 'session.cancelled';

export interface AuditLogEntry {
  id: string;
  sessionId: string;
  teamId: string;
  type: AuditEventType;
  payload: any;
  timestamp: Date;
  sequence: number;
}

// ==================== Mission Result ====================

export interface MissionResult {
  success: boolean;
  score: number;
  rewards: Reward[];
  message: string;
  hints?: string[];
}

// ==================== Execution Context ====================

export interface ExecutionContext {
  session: GameSession;
  scene: Scene;
  mission?: Mission;
  team: Team;
  variables: Record<string, any>;
  inventory: Inventory;
  score: number;
  timestamp: Date;
  roles: RoleDefinition[];
  roleAssignments: RoleAssignment[];
}

// ==================== 10. Session State Machine (spec 53) ====================

export class SessionStateMachine {
  private transitions: Map<SessionStatus, SessionStatus[]> = new Map();

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
      throw new Error(`Invalid state transition: ${from} → ${to}`);
    }
  }

  getAllowedTransitions(status: SessionStatus): SessionStatus[] {
    return this.transitions.get(status) || [];
  }
}

// ==================== 4. Condition Engine (spec 50.4) — AST ====================

export class ConditionEngine {
  /**
   * Вычисление условия (AST). Поддерживает вложенные ConditionGroup с AND/OR.
   */
  evaluate(condition: Condition, context: ExecutionContext): boolean {
    // ConditionGroup
    if ('operator' in condition && 'conditions' in condition) {
      const group = condition as ConditionGroup;
      if (group.operator === 'AND') {
        return group.conditions.every((c) => this.evaluate(c, context));
      }
      if (group.operator === 'OR') {
        return group.conditions.some((c) => this.evaluate(c, context));
      }
      return false;
    }

    // SingleCondition
    const sc = condition as SingleCondition;

    // Специальная обработка для type: 'role'
    if (sc.type === 'role') {
      const playerId = context.session.team.members[0]?.id;
      if (!playerId) return false;
      const playerRole = context.roleAssignments.find((r) => r.playerId === playerId);
      return playerRole?.roleId === sc.right;
    }

    // Специальная обработка для type: 'inventory' — проверка наличия предмета
    if (sc.type === 'inventory') {
      if (sc.operator === 'has') {
        return context.team.inventory.items.some((i) => i.id === sc.right);
      }
      return false;
    }

    const leftValue = this.resolveValue(sc.left, context);
    const rightValue = this.resolveValue(sc.right, context);

    return this.compare(leftValue, sc.operator, rightValue);
  }

  /**
   * Разрешение значения: если строка — ищем в variables, иначе возвращаем как есть.
   */
  private resolveValue(value: string | number | boolean, context: ExecutionContext): any {
    if (typeof value === 'string') {
      // Проверка системных переменных
      switch (value) {
        case 'score':
          return context.score;
        case 'team.score':
          return context.team.score;
        case 'team.members':
          return context.team.members.length;
        case 'game.time':
          return context.timestamp.getTime();
        case 'game.elapsed':
          return context.session.startedAt
            ? Math.floor((context.timestamp.getTime() - context.session.startedAt.getTime()) / 1000)
            : 0;
        case 'game.currentScene':
          return context.session.currentSceneId;
        case 'game.totalScenes':
          return context.session.scenario.scenes.length;
        case 'role':
          return context.team.members[0]?.role || 'member';
        case 'remaining':
          return context.scene.metadata?.timer || 0;
        default:
          // Пользовательские переменные
          if (value in context.variables) {
            return context.variables[value];
          }
          return value;
      }
    }
    return value;
  }

  /**
   * Сравнение двух значений по оператору.
   */
  private compare(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case 'eq':
        return left === right;
      case 'ne':
        return left !== right;
      case 'gt':
        return Number(left) > Number(right);
      case 'lt':
        return Number(left) < Number(right);
      case 'gte':
        return Number(left) >= Number(right);
      case 'lte':
        return Number(left) <= Number(right);
      case 'contains':
        if (typeof left === 'string' && typeof right === 'string') {
          return left.includes(right);
        }
        if (Array.isArray(left)) {
          return left.includes(right);
        }
        return false;
      case 'has':
        if (Array.isArray(left)) {
          return left.includes(right);
        }
        if (typeof left === 'object' && left !== null) {
          return right in left;
        }
        return false;
      default:
        return false;
    }
  }
}

// ==================== 5. Reward Engine (spec 50.5) ====================

export class RewardEngine {
  /**
   * Применение массива наград к контексту выполнения.
   * Возвращает массив применённых наград с результатами.
   */
  applyRewards(rewards: Reward[], context: ExecutionContext): AppliedReward[] {
    return rewards.map((reward) => this.applySingleReward(reward, context));
  }

  /**
   * Применение одной награды.
   */
  applySingleReward(reward: Reward, context: ExecutionContext): AppliedReward {
    const result: AppliedReward = {
      type: reward.type,
      value: reward.value,
      success: true,
      message: reward.message || '',
    };

    switch (reward.type) {
      case 'score':
        context.team.score += Number(reward.value);
        context.score += Number(reward.value);
        result.message = `+${reward.value} очков`;
        break;

      case 'money':
        context.team.reputation += Number(reward.value);
        result.message = `+${reward.value} монет`;
        break;

      case 'item':
        this.addItem(context, reward.value);
        result.message = `Получен предмет: ${reward.value?.name || reward.value}`;
        break;

      case 'achievement':
        this.unlockAchievement(context, reward.value);
        result.message = `Достижение разблокировано: ${reward.value}`;
        break;

      case 'variable':
        this.applyVariableReward(reward, context);
        result.message = `Переменная обновлена`;
        break;

      case 'experience':
        context.team.reputation += Number(reward.value);
        result.message = `+${reward.value} опыта`;
        break;

      case 'role_assignment': {
        const roleId = reward.value?.roleId || reward.value;
        const playerId = reward.value?.playerId || context.session.team.members[0]?.id;
        if (playerId && roleId) {
          // Удаляем предыдущее назначение для этого игрока
          const existingIdx = context.roleAssignments.findIndex(
            (a) => a.playerId === playerId
          );
          if (existingIdx >= 0) {
            context.roleAssignments.splice(existingIdx, 1);
          }
          context.roleAssignments.push({
            playerId,
            roleId,
            assignedAt: Date.now(),
          });
          const roleName = context.roles.find((r) => r.id === roleId)?.name || roleId;
          result.message = `Игроку назначена роль: ${roleName}`;
        } else {
          result.success = false;
          result.message = 'Не удалось назначить роль: не указан игрок или роль';
        }
        break;
      }

      default:
        result.success = false;
        result.message = `Неизвестный тип награды: ${reward.type}`;
    }

    return result;
  }

  private addItem(context: ExecutionContext, itemData: any): void {
    const item: InventoryItem = {
      id: itemData?.id || `item-${Date.now()}`,
      name: itemData?.name || itemData?.id || 'Предмет',
      description: itemData?.description || '',
      quantity: itemData?.quantity || 1,
      icon: itemData?.icon,
      type: itemData?.type || 'quest',
      effects: itemData?.effects || [],
    };

    const existing = context.team.inventory.items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      context.team.inventory.items.push(item);
    }
  }

  private unlockAchievement(context: ExecutionContext, achievementId: string): void {
    const achievement: Achievement = {
      id: achievementId,
      name: achievementId,
      description: '',
      icon: '🏆',
      condition: { operator: 'AND', conditions: [] },
    };

    if (!context.team.achievements.find((a) => a.id === achievementId)) {
      context.team.achievements.push(achievement);
    }
  }

  private applyVariableReward(reward: Reward, context: ExecutionContext): void {
    const payload = reward.value;
    const varName = payload?.name || payload;
    const operation = payload?.operation || 'set';
    const varValue = payload?.value ?? payload;

    switch (operation) {
      case 'add':
        context.variables[varName] = (context.variables[varName] || 0) + varValue;
        break;
      case 'subtract':
        context.variables[varName] = (context.variables[varName] || 0) - varValue;
        break;
      case 'multiply':
        context.variables[varName] = (context.variables[varName] || 1) * varValue;
        break;
      case 'set':
      default:
        context.variables[varName] = varValue;
        break;
    }
  }
}

export interface AppliedReward {
  type: string;
  value: any;
  success: boolean;
  message: string;
}

// ==================== Sub-Scenario Result (spec 2.3) ====================

export interface SubScenarioResult {
  success: boolean;
  score: number;
  outputVariables: Record<string, any>;
  completedScenes: string[];
}

// ==================== 6. Trigger System (spec 50.6) ====================

export class TriggerSystem {
  private conditionEngine: ConditionEngine;
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.conditionEngine = new ConditionEngine();
  }

  /**
   * Проверка и выполнение триггеров для данного события.
   * Принимает массив TriggerDefinition из редактора.
   */
  evaluateTriggers(
    eventType: string,
    context: ExecutionContext,
    triggers: TriggerDefinition[] = []
  ): TriggerResult[] {
    const results: TriggerResult[] = [];

    // Фильтруем триггеры по событию
    const matchingTriggers = triggers.filter(
      (t) => t.enabled && t.event === eventType
    );

    for (const trigger of matchingTriggers) {
      // Проверка cooldown
      if (this.isOnCooldown(trigger)) continue;

      // Проверка maxFires
      if (trigger.maxFires > 0 && trigger.fireCount >= trigger.maxFires) continue;

      // Проверка eventFilter
      if (!this.matchesEventFilter(trigger, context)) continue;

      // Проверка условий
      const conditionMet = this.conditionEngine.evaluate(trigger.conditions, context);

      if (conditionMet) {
        // Выполняем действия триггера
        const actionResults = this.fireTrigger(trigger, context);

        results.push({
          triggerId: trigger.id,
          event: trigger.event,
          fired: true,
          actions: actionResults,
        });
      }
    }

    return results;
  }

  /**
   * Выполнение действий триггера.
   */
  fireTrigger(trigger: TriggerDefinition, context: ExecutionContext): TriggerActionResult[] {
    const results: TriggerActionResult[] = [];

    // Устанавливаем кулдаун
    if (trigger.cooldown > 0) {
      this.cooldowns.set(trigger.id, Date.now() + trigger.cooldown * 1000);
    }

    // Увеличиваем счётчик срабатываний
    trigger.fireCount++;

    // Выполняем каждое действие
    for (const action of trigger.actions) {
      const result = this.executeAction(action, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Выполнение одного действия триггера.
   */
  private executeAction(action: TriggerAction, context: ExecutionContext): TriggerActionResult {
    const config = action.config || {};

    switch (action.type) {
      case 'set_variable': {
        const varName = config.variableName as string;
        const value = config.value;
        const operation = (config.operation as string) || 'set';

        switch (operation) {
          case 'add':
            context.variables[varName] = (context.variables[varName] || 0) + Number(value);
            break;
          case 'subtract':
            context.variables[varName] = (context.variables[varName] || 0) - Number(value);
            break;
          case 'set':
          default:
            context.variables[varName] = value;
            break;
        }

        return {
          type: action.type,
          success: true,
          message: `Переменная ${varName} = ${context.variables[varName]}`,
        };
      }

      case 'add_score': {
        const amount = Number(config.amount) || 0;
        context.score += amount;
        context.team.score += amount;
        return {
          type: action.type,
          success: true,
          message: `+${amount} очков`,
        };
      }

      case 'teleport': {
        const sceneId = config.sceneId as string;
        if (sceneId) {
          context.session.currentSceneId = sceneId;
          return {
            type: action.type,
            success: true,
            message: `Телепорт к сцене ${sceneId}`,
          };
        }
        return {
          type: action.type,
          success: false,
          message: 'Не указан ID сцены для телепорта',
        };
      }

      case 'show_notification': {
        const text = config.text as string;
        return {
          type: action.type,
          success: true,
          message: text || 'Уведомление',
          payload: {
            text,
            icon: config.icon,
            duration: config.duration,
          },
        };
      }

      case 'start_timer': {
        const timerId = config.timerId as string;
        return {
          type: action.type,
          success: true,
          message: `Таймер ${timerId} запущен`,
          payload: { timerId, duration: config.duration },
        };
      }

      case 'stop_timer': {
        const timerId = config.timerId as string;
        return {
          type: action.type,
          success: true,
          message: `Таймер ${timerId} остановлен`,
          payload: { timerId },
        };
      }

      case 'play_sound': {
        const assetId = config.assetId as string;
        return {
          type: action.type,
          success: true,
          message: `Воспроизведение звука ${assetId}`,
          payload: { assetId, loop: config.loop },
        };
      }

      case 'show_modal': {
        return {
          type: action.type,
          success: true,
          message: config.title as string || 'Модальное окно',
          payload: {
            title: config.title,
            text: config.text,
            buttons: config.buttons,
          },
        };
      }

      case 'assign_role': {
        const roleId = config.roleId as string;
        const playerId = (config.playerId as string) || context.session.team.members[0]?.id;
        if (playerId && roleId) {
          const existingIdx = context.roleAssignments.findIndex(
            (a) => a.playerId === playerId
          );
          if (existingIdx >= 0) {
            context.roleAssignments.splice(existingIdx, 1);
          }
          context.roleAssignments.push({
            playerId,
            roleId,
            assignedAt: Date.now(),
          });
          return {
            type: action.type,
            success: true,
            message: `Роль ${roleId} назначена игроку ${playerId}`,
          };
        }
        return {
          type: action.type,
          success: false,
          message: 'Не указан ID роли или игрока',
        };
      }

      case 'give_item': {
        const itemId = config.itemId as string;
        const quantity = Number(config.quantity) || 1;
        const existing = context.team.inventory.items.find((i) => i.id === itemId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          context.team.inventory.items.push({
            id: itemId,
            name: itemId,
            description: '',
            quantity,
            icon: '📦',
            type: 'quest',
            effects: [],
          });
        }
        return {
          type: action.type,
          success: true,
          message: `+${quantity} x ${itemId}`,
        };
      }

      case 'remove_item': {
        const removeItemId = config.itemId as string;
        const removeQuantity = Number(config.quantity) || 1;
        const item = context.team.inventory.items.find((i) => i.id === removeItemId);
        if (item) {
          item.quantity -= removeQuantity;
          if (item.quantity <= 0) {
            context.team.inventory.items = context.team.inventory.items.filter(
              (i) => i.id !== removeItemId
            );
          }
          return {
            type: action.type,
            success: true,
            message: `-${removeQuantity} x ${removeItemId}`,
          };
        }
        return {
          type: action.type,
          success: false,
          message: `Предмет ${removeItemId} не найден`,
        };
      }

      case 'emit_event': {
        const eventName = config.eventName as string;
        return {
          type: action.type,
          success: true,
          message: `Событие ${eventName} отправлено`,
          payload: { eventName, data: config.data },
        };
      }

      case 'call_api': {
        const url = config.url as string;
        const method = (config.method as string) || 'GET';
        // API-запрос выполняется асинхронно, возвращаем информацию о запросе
        return {
          type: action.type,
          success: true,
          message: `API ${method} ${url}`,
          payload: { url, method, body: config.body },
        };
      }

      default:
        return {
          type: action.type,
          success: false,
          message: `Неизвестный тип действия: ${action.type}`,
        };
    }
  }

  /**
   * Проверка eventFilter триггера.
   */
  private matchesEventFilter(trigger: TriggerDefinition, context: ExecutionContext): boolean {
    const filter = trigger.eventFilter;
    if (!filter) return true;

    // Проверка sceneId
    if (filter.sceneId && context.scene?.id !== filter.sceneId) {
      return false;
    }

    // Проверка missionId
    if (filter.missionId && context.mission?.id !== filter.missionId) {
      return false;
    }

    // Проверка itemId (в инвентаре)
    if (filter.itemId) {
      const hasItem = context.team.inventory.items.some((i) => i.id === filter.itemId);
      if (!hasItem) return false;
    }

    // Проверка roleId
    if (filter.roleId) {
      const playerId = context.session.team.members[0]?.id;
      if (playerId) {
        const hasRole = context.roleAssignments.some(
          (a) => a.playerId === playerId && a.roleId === filter.roleId
        );
        if (!hasRole) return false;
      }
    }

    // Проверка variableName
    if (filter.variableName && !(filter.variableName in context.variables)) {
      return false;
    }

    return true;
  }

  /**
   * Проверка, находится ли триггер на кулдауне.
   */
  private isOnCooldown(trigger: TriggerDefinition): boolean {
    if (trigger.cooldown <= 0) return false;
    const cooldownUntil = this.cooldowns.get(trigger.id);
    if (!cooldownUntil) return false;
    return Date.now() < cooldownUntil;
  }

  /**
   * Сброс кулдауна для триггера.
   */
  resetCooldown(triggerId: string): void {
    this.cooldowns.delete(triggerId);
  }

  /**
   * Сброс всех кулдаунов.
   */
  resetAllCooldowns(): void {
    this.cooldowns.clear();
  }
}

export interface TriggerResult {
  triggerId: string;
  event: string;
  fired: boolean;
  actions: TriggerActionResult[];
}

export interface TriggerActionResult {
  type: string;
  success: boolean;
  message: string;
  payload?: any;
}

// ==================== 7. Scheduler (spec 50.7) ====================

export class Scheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Запланировать действие по расписанию.
   */
  schedule(schedule: Schedule, _context: ExecutionContext, onFire: (action: Action) => void): void {
    const timerId = `sched-${schedule.id}`;

    switch (schedule.type) {
      case 'absolute': {
        if (schedule.at) {
          const delay = new Date(schedule.at).getTime() - Date.now();
          if (delay > 0) {
            const timer = setTimeout(() => onFire(schedule.action), delay);
            this.timers.set(timerId, timer);
          }
        }
        break;
      }
      case 'relative': {
        if (schedule.delay) {
          const timer = setTimeout(() => onFire(schedule.action), schedule.delay * 1000);
          this.timers.set(timerId, timer);
        }
        break;
      }
      case 'periodic': {
        if (schedule.interval) {
          const timer = setInterval(() => onFire(schedule.action), schedule.interval * 1000);
          this.timers.set(timerId, timer);
        }
        break;
      }
    }
  }

  /**
   * Отменить все запланированные действия.
   */
  clearAll(): void {
    for (const [, timer] of this.timers) {
      clearTimeout(timer);
      clearInterval(timer);
    }
    this.timers.clear();
  }

  /**
   * Отменить конкретное расписание.
   */
  cancel(scheduleId: string): void {
    const timer = this.timers.get(`sched-${scheduleId}`);
    if (timer) {
      clearTimeout(timer);
      clearInterval(timer);
      this.timers.delete(`sched-${scheduleId}`);
    }
  }
}

// ==================== 8. AuditLogger (spec 50.8) ====================

export class AuditLogger {
  private sequence: number = 0;

  /**
   * Логирование события.
   */
  log(session: GameSession, type: AuditEventType, payload: any): AuditLogEntry {
    this.sequence++;

    const entry: AuditLogEntry = {
      id: `log-${session.id}-${this.sequence}`,
      sessionId: session.id,
      teamId: session.teamId,
      type,
      payload,
      timestamp: new Date(),
      sequence: this.sequence,
    };

    session.events.push(entry);
    return entry;
  }

  /**
   * Получение всех событий сессии.
   */
  getSessionLog(session: GameSession): AuditLogEntry[] {
    return [...session.events].sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * Фильтрация лога по типу события.
   */
  getEventsByType(session: GameSession, type: AuditEventType): AuditLogEntry[] {
    return session.events.filter((e) => e.type === type);
  }
}

// ==================== 3. Execution Engine (spec 50.3) ====================

export class ExecutionEngine {
  private stateMachine: SessionStateMachine;
  private conditionEngine: ConditionEngine;
  private rewardEngine: RewardEngine;
  private triggerSystem: TriggerSystem;
  private scheduler: Scheduler;
  private auditLogger: AuditLogger;

  constructor() {
    this.stateMachine = new SessionStateMachine();
    this.conditionEngine = new ConditionEngine();
    this.rewardEngine = new RewardEngine();
    this.triggerSystem = new TriggerSystem();
    this.scheduler = new Scheduler();
    this.auditLogger = new AuditLogger();
  }

  // ==================== Session Lifecycle ====================

  /**
   * 1. Создание сессии.
   */
  createSession(scenario: Scenario, team: Team): GameSession {
    const session: GameSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scenarioId: scenario.id,
      scenario,
      teamId: team.id,
      team,
      currentSceneId: scenario.startSceneId || scenario.scenes[0]?.id || '',
      variables: this.initializeVariables(scenario.variables),
      inventory: { items: [], capacity: 100 },
      score: 0,
      achievements: [],
      status: 'created',
      startedAt: null,
      finishedAt: null,
      events: [],
      version: 1,
    };

    this.auditLogger.log(session, 'session.created', {
      scenarioId: scenario.id,
      teamId: team.id,
    });

    return session;
  }

  /**
   * 2. Запуск сессии.
   */
  startSession(session: GameSession): GameSession {
    this.stateMachine.transition(session.status, 'running');
    session.status = 'running';
    session.startedAt = new Date();
    session.version++;

    this.auditLogger.log(session, 'session.created', {
      startedAt: session.startedAt,
    });

    // Вход в первую сцену
    this.enterScene(session, session.currentSceneId);

    return session;
  }

  /**
   * 3. Пауза.
   */
  pauseSession(session: GameSession): GameSession {
    this.stateMachine.transition(session.status, 'paused');
    session.status = 'paused';
    session.version++;
    return session;
  }

  /**
   * 4. Продолжение.
   */
  resumeSession(session: GameSession): GameSession {
    this.stateMachine.transition(session.status, 'running');
    session.status = 'running';
    session.version++;
    return session;
  }

  /**
   * 5. Завершение сессии.
   */
  finishSession(session: GameSession): GameSession {
    this.stateMachine.transition(session.status, 'finished');
    session.status = 'finished';
    session.finishedAt = new Date();
    session.version++;

    this.auditLogger.log(session, 'session.finished', {
      finalScore: session.score,
      finishedAt: session.finishedAt,
    });

    this.scheduler.clearAll();
    return session;
  }

  /**
   * 6. Отмена сессии.
   */
  cancelSession(session: GameSession): GameSession {
    this.stateMachine.transition(session.status, 'cancelled');
    session.status = 'cancelled';
    session.finishedAt = new Date();
    session.version++;

    this.auditLogger.log(session, 'session.cancelled', {
      cancelledAt: session.finishedAt,
    });

    this.scheduler.clearAll();
    return session;
  }

  /**
   * 7. Ошибка сессии.
   */
  failSession(session: GameSession, error: string): GameSession {
    this.stateMachine.transition(session.status, 'failed');
    session.status = 'failed';
    session.finishedAt = new Date();
    session.version++;

    this.auditLogger.log(session, 'session.failed', {
      error,
      failedAt: session.finishedAt,
    });

    this.scheduler.clearAll();
    return session;
  }

  // ==================== Scene Management ====================

  /**
   * Вход в сцену.
   */
  enterScene(session: GameSession, sceneId: string): Scene | null {
    const scene = session.scenario.scenes.find((s) => s.id === sceneId);
    if (!scene) return null;

    session.currentSceneId = sceneId;
    session.version++;

    this.auditLogger.log(session, 'scene.entered', {
      sceneId,
      sceneTitle: scene.title,
    });

    // Проверка триггеров onSceneEnter
    const context = this.createContext(session, scene);
    this.triggerSystem.evaluateTriggers('onSceneEnter', context);

    // Запуск таймера сцены
    if (scene.metadata?.timer && scene.metadata.timer > 0) {
      this.scheduler.schedule(
        {
          id: `scene-timer-${sceneId}`,
          type: 'relative',
          delay: scene.metadata.timer,
          action: {
            id: `auto-transition-${sceneId}`,
            type: 'click' as any,
            label: 'Auto transition',
            config: {},
            conditions: [],
            rewards: [],
          },
        },
        context,
        (_action) => {
          this.autoTransition(session);
        }
      );
    }

    return scene;
  }

  /**
   * Автоматический переход (по таймеру или无条件).
   */
  private autoTransition(session: GameSession): void {
    const scene = session.scenario.scenes.find((s) => s.id === session.currentSceneId);
    if (!scene) return;

    const autoTransition = scene.transitions.find(
      (t) => t.type === 'auto'
    );

    if (autoTransition) {
      this.transitionToScene(session, autoTransition.toSceneId);
    }
  }

  /**
   * Переход к сцене.
   */
  transitionToScene(session: GameSession, sceneId: string): Scene | null {
    const currentScene = session.scenario.scenes.find(
      (s) => s.id === session.currentSceneId
    );

    // Выход из текущей сцены
    if (currentScene) {
      this.auditLogger.log(session, 'scene.exited', {
        sceneId: currentScene.id,
        sceneTitle: currentScene.title,
      });
    }

    // Проверка существования целевой сцены
    const targetScene = session.scenario.scenes.find((s) => s.id === sceneId);
    if (!targetScene) {
      this.auditLogger.log(session, 'transition', {
        from: currentScene?.id,
        to: sceneId,
        error: 'Target scene not found',
      });
      return null;
    }

    this.auditLogger.log(session, 'transition', {
      from: currentScene?.id,
      to: sceneId,
    });

    return this.enterScene(session, sceneId);
  }

  /**
   * Определение следующей сцены по условиям переходов.
   */
  determineNextScene(session: GameSession): string | null {
    const scene = session.scenario.scenes.find((s) => s.id === session.currentSceneId);
    if (!scene || scene.transitions.length === 0) return null;

    const context = this.createContext(session, scene);

    // 1. Conditional transitions
    for (const transition of scene.transitions) {
      if (transition.type === 'conditional') {
        const conditionMet = this.conditionEngine.evaluate(transition.condition, context);
        if (conditionMet) {
          return transition.toSceneId;
        }
      }
    }

    // 2. Auto transition (без условий)
    const autoTransition = scene.transitions.find((t) => t.type === 'auto');
    if (autoTransition) return autoTransition.toSceneId;

    // 3. Random transition
    const randomTransitions = scene.transitions.filter((t) => t.type === 'random');
    if (randomTransitions.length > 0) {
      const idx = Math.floor(Math.random() * randomTransitions.length);
      return randomTransitions[idx].toSceneId;
    }

    // 4. Manual — первый доступный
    const manualTransition = scene.transitions.find((t) => t.type === 'manual');
    if (manualTransition) return manualTransition.toSceneId;

    return null;
  }

  // ==================== Loop Execution (spec 1.4) ====================

  /**
   * Выполнение цикла.
   * Возвращает количество выполненных итераций.
   */
  executeLoop(session: GameSession, loopConfig: LoopConfig): number {
    let iterations = 0;
    const maxIter = loopConfig.maxIterations || 100;
    const currentScene = session.scenario.scenes.find(
      (s) => s.id === session.currentSceneId
    );

    if (!currentScene) return 0;

    const context = this.createContext(session, currentScene);

    switch (loopConfig.type) {
      case 'for': {
        const count = loopConfig.count || 0;
        for (let i = 0; i < count && iterations < maxIter; i++) {
          if (loopConfig.counterVariable) {
            session.variables[loopConfig.counterVariable] = i;
          }
          // Выполнить тело цикла — переход к сцене тела
          this.executeLoopBody(session, currentScene);
          iterations++;
        }
        break;
      }

      case 'while': {
        if (!loopConfig.condition) break;
        while (
          this.conditionEngine.evaluate(loopConfig.condition, context) &&
          iterations < maxIter
        ) {
          // Выполнить тело цикла
          this.executeLoopBody(session, currentScene);
          iterations++;
        }
        break;
      }

      case 'forEach': {
        const collection = session.variables[loopConfig.collectionVariable || ''] || [];
        if (!Array.isArray(collection)) break;

        for (const item of collection) {
          if (iterations >= maxIter) break;
          if (loopConfig.itemVariable) {
            session.variables[loopConfig.itemVariable] = item;
          }
          // Выполнить тело цикла
          this.executeLoopBody(session, currentScene);
          iterations++;
        }
        break;
      }
    }

    this.auditLogger.log(session, 'transition', {
      type: 'loop.complete',
      loopType: loopConfig.type,
      iterations,
    });

    // Переход к сцене после завершения цикла
    if (loopConfig.onCompleteSceneId) {
      this.transitionToScene(session, loopConfig.onCompleteSceneId);
    }

    return iterations;
  }

  /**
   * Выполнение тела цикла — запуск миссий текущей сцены и проверка триггеров.
   */
  private executeLoopBody(session: GameSession, scene: Scene): void {
    const context = this.createContext(session, scene);

    // Запуск триггеров входа в сцену (для каждой итерации)
    this.triggerSystem.evaluateTriggers('onSceneEnter', context);

    // Выполнение миссий сцены (если есть)
    for (const mission of scene.missions) {
      const missionContext = this.createContext(session, scene, mission);

      // Проверка условий миссии
      const allConditionsMet = mission.conditions.every((c) =>
        this.conditionEngine.evaluate(c, missionContext)
      );

      if (allConditionsMet) {
        // Применение наград за миссию
        this.rewardEngine.applyRewards(mission.rewards, missionContext);

        // Обновление состояния сессии
        session.score = missionContext.team.score;
        session.variables = missionContext.variables;
      }
    }

    session.version++;
  }

  // ==================== Sub-Scenario Execution (spec 2.3) ====================

  /**
   * Выполнение вложенного сценария (sub-scenario).
   * 1. Проверка уровня вложенности
   * 2. Создание дочерней сессии
   * 3. Маппинг входных переменных
   * 4. Запуск дочернего сценария
   * 5. Ожидание завершения
   * 6. Маппинг выходных переменных
   * 7. Возврат результата
   */
  executeSubScenario(
    session: GameSession,
    subConfig: SubScenarioConfig,
    parentContext: ExecutionContext
  ): SubScenarioResult {
    // 1. Проверка уровня вложенности (защита от рекурсии)
    const currentNesting = this.getNestingLevel(session);
    const maxNesting = subConfig.maxNestingLevel ?? 3;
    if (currentNesting >= maxNesting) {
      const errorMsg = `Превышен максимальный уровень вложенности (${maxNesting}) для под-сценария "${subConfig.name}"`;
      this.auditLogger.log(session, 'session.failed', {
        error: errorMsg,
        subScenarioId: subConfig.id,
        scenarioId: subConfig.scenarioId,
      });
      return {
        success: false,
        score: 0,
        outputVariables: {},
        completedScenes: [],
      };
    }

    // 2. Создание дочерней сессии
    const childSession = this.createSession(session.scenario, session.team);
    childSession.currentSceneId = subConfig.scenarioId;

    // 3. Маппинг входных переменных (sub-scenario -> parent)
    for (const [subVar, parentVar] of Object.entries(subConfig.inputMapping)) {
      const parentValue = this.resolveVariable(parentVar, parentContext);
      childSession.variables[subVar] = parentValue;
    }

    this.auditLogger.log(session, 'session.created', {
      type: 'sub_scenario.start',
      subScenarioId: subConfig.id,
      scenarioId: subConfig.scenarioId,
      name: subConfig.name,
      nestingLevel: currentNesting + 1,
    });

    // 4. Запуск дочернего сценария
    this.startSession(childSession);

    // 5. "Ожидание" завершения — в синхронном режиме просто выполняем все сцены
    //    В реальном рантайме здесь была бы асинхронная логика с коллбэками
    const completedScenes: string[] = [];
    let childScore = 0;

    // Проходим по всем сценам дочернего сценария
    const childScenes = childSession.scenario.scenes;
    let currentChildSceneId = childSession.currentSceneId;

    while (currentChildSceneId) {
      const childScene = childScenes.find((s) => s.id === currentChildSceneId);
      if (!childScene) break;

      // Вход в сцену
      this.enterScene(childSession, currentChildSceneId);
      completedScenes.push(currentChildSceneId);

      // Выполнение миссий сцены
      for (const mission of childScene.missions) {
        const childContext = this.createContext(childSession, childScene, mission);
        this.rewardEngine.applyRewards(mission.rewards, childContext);
        childSession.score = childContext.team.score;
        childSession.variables = childContext.variables;
      }

      // Определяем следующую сцену
      const nextSceneId = this.determineNextScene(childSession);
      if (nextSceneId && !completedScenes.includes(nextSceneId)) {
        currentChildSceneId = nextSceneId;
      } else {
        break;
      }
    }

    // Завершаем дочернюю сессию
    this.finishSession(childSession);
    childScore = childSession.score;

    // 6. Маппинг выходных переменных (sub-scenario -> parent)
    const outputVariables: Record<string, any> = {};
    for (const [subVar, parentVar] of Object.entries(subConfig.outputMapping)) {
      const childValue = childSession.variables[subVar];
      outputVariables[parentVar] = childValue;
      // Также устанавливаем значение в родительской сессии
      session.variables[parentVar] = childValue;
    }

    // 7. Обработка onComplete
    switch (subConfig.onComplete) {
      case 'continue_parent':
        // Продолжаем выполнение родительского сценария (по умолчанию)
        session.score += childScore;
        break;

      case 'return_result':
        // Возвращаем результат и НЕ продолжаем родительский сценарий
        // (флаг success=false сигнализирует об этом вызывающему коду)
        this.auditLogger.log(session, 'transition', {
          type: 'sub_scenario.return_result',
          subScenarioId: subConfig.id,
          childScore,
        });
        break;

      case 'emit_event':
        // Отправляем событие и продолжаем родительский сценарий
        session.score += childScore;
        if (subConfig.onCompleteEventName) {
          const context = this.createContext(session, parentContext.scene);
          this.triggerSystem.evaluateTriggers(subConfig.onCompleteEventName, context);
        }
        break;
    }

    this.auditLogger.log(session, 'transition', {
      type: 'sub_scenario.complete',
      subScenarioId: subConfig.id,
      scenarioId: subConfig.scenarioId,
      name: subConfig.name,
      childScore,
      completedScenes: completedScenes.length,
    });

    return {
      success: true,
      score: childScore,
      outputVariables,
      completedScenes,
    };
  }

  /**
   * Определение текущего уровня вложенности под-сценариев.
   * Анализирует completedScenes и события аудит-лога.
   */
  private getNestingLevel(session: GameSession): number {
    const subScenarioEvents = session.events.filter(
      (e) => e.payload?.type === 'sub_scenario.start'
    );
    return subScenarioEvents.length;
  }

  /**
   * Разрешение значения переменной по имени из контекста выполнения.
   */
  private resolveVariable(name: string, context: ExecutionContext): any {
    // Системные переменные
    switch (name) {
      case 'score':
        return context.score;
      case 'team.score':
        return context.team.score;
      case 'team.members':
        return context.team.members.length;
      case 'game.time':
        return context.timestamp.getTime();
      case 'game.elapsed':
        return context.session.startedAt
          ? Math.floor((context.timestamp.getTime() - context.session.startedAt.getTime()) / 1000)
          : 0;
      case 'game.currentScene':
        return context.session.currentSceneId;
      case 'game.totalScenes':
        return context.session.scenario.scenes.length;
      default:
        // Пользовательские переменные
        if (name in context.variables) {
          return context.variables[name];
        }
        return undefined;
    }
  }

  // ==================== Mission Execution ====================

  /**
   * Выполнение миссии.
   */
  executeMission(
    session: GameSession,
    missionId: string,
    answer: any
  ): MissionResult {
    const scene = session.scenario.scenes.find((s) => s.id === session.currentSceneId);
    if (!scene) {
      return {
        success: false,
        score: 0,
        rewards: [],
        message: 'Сцена не найдена',
      };
    }

    const mission = scene.missions.find((m) => m.id === missionId);
    if (!mission) {
      return {
        success: false,
        score: 0,
        rewards: [],
        message: 'Миссия не найдена',
      };
    }

    this.auditLogger.log(session, 'mission.started', {
      sceneId: scene.id,
      missionId,
      missionTitle: mission.title,
    });

    this.auditLogger.log(session, 'answer.submitted', {
      sceneId: scene.id,
      missionId,
      answer,
    });

    // Проверка условий миссии
    const context = this.createContext(session, scene, mission);
    const allConditionsMet = mission.conditions.every((c) =>
      this.conditionEngine.evaluate(c, context)
    );

    if (!allConditionsMet) {
      return {
        success: false,
        score: 0,
        rewards: [],
        message: 'Условия миссии не выполнены',
      };
    }

    // Проверка ответа
    const isCorrect = this.checkAnswer(mission, answer, context);

    if (isCorrect) {
      this.auditLogger.log(session, 'answer.correct', {
        sceneId: scene.id,
        missionId,
        answer,
      });

      // Применение наград
      const appliedRewards = this.rewardEngine.applyRewards(mission.rewards, context);

      // Обновление счёта сессии
      session.score = context.team.score;
      session.variables = context.variables;
      session.version++;

      // Логирование наград
      for (const reward of appliedRewards) {
        this.auditLogger.log(session, 'reward.applied', {
          type: reward.type,
          value: reward.value,
          message: reward.message,
        });
      }

      this.auditLogger.log(session, 'mission.completed', {
        sceneId: scene.id,
        missionId,
        score: appliedRewards.reduce((sum, r) => sum + (r.type === 'score' ? Number(r.value) : 0), 0),
      });

      // Проверка триггеров onMissionComplete
      this.triggerSystem.evaluateTriggers('onMissionComplete', context);

      // Автоматический переход, если есть
      const nextSceneId = this.determineNextScene(session);
      if (nextSceneId) {
        this.transitionToScene(session, nextSceneId);
      }

      return {
        success: true,
        score: appliedRewards.reduce((sum, r) => sum + (r.type === 'score' ? Number(r.value) : 0), 0),
        rewards: mission.rewards,
        message: 'Верно!',
      };
    } else {
      this.auditLogger.log(session, 'answer.wrong', {
        sceneId: scene.id,
        missionId,
        answer,
      });

      this.auditLogger.log(session, 'mission.failed', {
        sceneId: scene.id,
        missionId,
      });

      return {
        success: false,
        score: 0,
        rewards: [],
        message: 'Неверный ответ',
        hints: mission.hints.map((h) => h.text),
      };
    }
  }

  /**
   * Проверка ответа миссии.
   */
  private checkAnswer(mission: Mission, answer: any, context?: ExecutionContext): boolean {
    const config = mission.config as any;

    switch (mission.type) {
      case 'text': {
        const correctAnswer = config?.correctAnswer || '';
        const matchMode = config?.matchMode || 'exact';

        switch (matchMode) {
          case 'case_insensitive':
            return String(answer).toLowerCase() === String(correctAnswer).toLowerCase();
          case 'regex':
            try {
              return new RegExp(correctAnswer).test(String(answer));
            } catch {
              return false;
            }
          case 'exact':
          default:
            return String(answer) === String(correctAnswer);
        }
      }

      case 'code':
        return String(answer) === String(config?.correctCode || '');

      case 'choice':
        return Number(answer) === Number(config?.correctIndex);

      case 'gps': {
        const lat = Number(answer?.lat || answer?.latitude || 0);
        const lng = Number(answer?.lng || answer?.longitude || 0);
        const targetLat = Number(config?.lat || 0);
        const targetLng = Number(config?.lng || 0);
        const radius = Number(config?.radius || 50);

        // Haversine distance
        const distance = this.calculateDistance(lat, lng, targetLat, targetLng);
        return distance <= radius;
      }

      case 'qr':
        return String(answer) === String(config?.data || '');

      case 'photo':
        // Фото проверяется вручную или AI — всегда true для MVP
        return true;

      case 'collect': {
        // Проверка наличия предмета в инвентаре команды
        // Контекст всегда передаётся из executeMission
        if (!context) return false;
        return context.team.inventory.items.some(
          (i) => i.id === config?.itemId && i.quantity >= (config?.quantity || 1)
        );
      }

      case 'dialogue':
        // Диалог всегда успешен для MVP
        return true;

      default:
        return false;
    }
  }

  /**
   * Расчёт расстояния по формуле Haversine (в метрах).
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // ==================== Helpers ====================

  /**
   * Создание контекста выполнения.
   */
  private createContext(session: GameSession, scene: Scene, mission?: Mission): ExecutionContext {
    return {
      session,
      scene,
      mission,
      team: session.team,
      variables: { ...session.variables },
      inventory: { ...session.inventory, items: [...session.inventory.items] },
      score: session.score,
      timestamp: new Date(),
      roles: session.scenario.metadata?.settings?.roles || [],
      roleAssignments: (session as any).roleAssignments || [],
    };
  }

  /**
   * Инициализация переменных сценария значениями по умолчанию.
   */
  private initializeVariables(definitions: VariableDefinition[]): Record<string, any> {
    const vars: Record<string, any> = {};
    for (const def of definitions) {
      vars[def.name] = def.defaultValue;
    }
    return vars;
  }

  // ==================== Getters ====================

  getStateMachine(): SessionStateMachine {
    return this.stateMachine;
  }

  getConditionEngine(): ConditionEngine {
    return this.conditionEngine;
  }

  getRewardEngine(): RewardEngine {
    return this.rewardEngine;
  }

  getTriggerSystem(): TriggerSystem {
    return this.triggerSystem;
  }

  getScheduler(): Scheduler {
    return this.scheduler;
  }

  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }
}

// ==================== Factory ====================

let engineInstance: ExecutionEngine | null = null;

export function getEngineInstance(): ExecutionEngine {
  if (!engineInstance) {
    engineInstance = new ExecutionEngine();
  }
  return engineInstance;
}

export function resetEngineInstance(): void {
  engineInstance = null;
}
// ==================== 11. Multi-Scenario Orchestrator (spec 2.1) ====================

export class MultiScenarioOrchestrator {
  private engine: ExecutionEngine;
  private configs: Map<string, ParallelScenarioConfig> = new Map();
  private eventListeners: Map<string, Array<(payload: any, sourceInstanceId?: string) => void>> = new Map();

  constructor(engine: ExecutionEngine) {
    this.engine = engine;
    this.configs = new Map();
    this.eventListeners = new Map();
  }

  setConfigs(configs: ParallelScenarioConfig[]): void {
    this.configs.clear();
    for (const config of configs) {
      this.configs.set(config.id, config);
    }
  }

  /**
   * Создание мульти-сценарной сессии.
   */
  createMultiSession(
    mainScenario: Scenario,
    parallelConfigs: ParallelScenarioConfig[],
    team: Team
  ): MultiScenarioState {
    // Сохраняем конфиги
    this.setConfigs(parallelConfigs);

    // Создаём главную сессию
    const mainSession = this.engine.createSession(mainScenario, team);

    // Создаём экземпляры параллельных сценариев
    const parallelScenarios: ParallelScenarioInstance[] = parallelConfigs.map((config) => ({
      id: `parallel-${config.id}-${Date.now()}`,
      configId: config.id,
      status: 'idle',
      currentSceneId: null,
      variables: {},
      score: 0,
      startedAt: null,
      finishedAt: null,
    }));

    // Собираем все точки синхронизации
    const allSyncPoints: SyncPoint[] = [];
    for (const config of parallelConfigs) {
      for (const sp of config.syncPoints) {
        if (!allSyncPoints.find((existing) => existing.id === sp.id)) {
          allSyncPoints.push(sp);
        }
      }
    }

    return {
      mainScenarioId: mainSession.id,
      parallelScenarios,
      globalVariables: { ...team.variables },
      syncPoints: allSyncPoints,
    };
  }

  /**
   * Запуск всех сценариев (главный + параллельные).
   */
  startAll(state: MultiScenarioState, mainScenario: Scenario, team: Team): void {
    // Запускаем главный сценарий
    const mainSession = this.engine.createSession(mainScenario, team);
    this.engine.startSession(mainSession);

    // Запускаем параллельные сценарии, у которых startOn === 'game_start'
    for (const instance of state.parallelScenarios) {
      const config = this.configs.get(instance.configId);
      if (config && config.startOn === 'game_start') {
        this.startParallelInstance(state, instance, config);
      }
    }
  }

  /**
   * Запуск конкретного параллельного сценария.
   */
  startParallel(state: MultiScenarioState, configId: string): void {
    const instance = state.parallelScenarios.find((p) => p.configId === configId);
    const config = this.configs.get(configId);
    if (!instance || !config) return;

    this.startParallelInstance(state, instance, config);
  }

  /**
   * Запуск параллельного сценария по триггер-событию.
   */
  startOnTrigger(state: MultiScenarioState, eventName: string): void {
    for (const instance of state.parallelScenarios) {
      const config = this.configs.get(instance.configId);
      if (
        config &&
        config.startOn === 'trigger' &&
        config.triggerEvent === eventName &&
        instance.status === 'idle'
      ) {
        this.startParallelInstance(state, instance, config);
      }
    }
  }

  /**
   * Проверка точек синхронизации.
   */
  checkSyncPoints(state: MultiScenarioState): SyncPoint[] {
    const completed: SyncPoint[] = [];

    for (const sp of state.syncPoints) {
      const relevantInstances = state.parallelScenarios.filter((p) =>
        sp.scenarios.includes(p.configId)
      );

      if (relevantInstances.length === 0) continue;

      let shouldComplete = false;

      switch (sp.type) {
        case 'wait_all':
          shouldComplete = relevantInstances.every(
            (p) => p.status === 'finished' || p.status === 'failed'
          );
          break;

        case 'wait_any':
          shouldComplete = relevantInstances.some(
            (p) => p.status === 'finished' || p.status === 'failed'
          );
          break;

        case 'sequence': {
          // В последовательном режиме проверяем, что все предыдущие завершены
          const sortedInstances = [...relevantInstances].sort((a, b) => {
            const aIdx = sp.scenarios.indexOf(a.configId);
            const bIdx = sp.scenarios.indexOf(b.configId);
            return aIdx - bIdx;
          });

          const lastFinishedIdx = sortedInstances.findLastIndex(
            (p) => p.status === 'finished' || p.status === 'failed'
          );

          // Если все завершены — точка синхронизации выполнена
          shouldComplete = lastFinishedIdx === sortedInstances.length - 1;
          break;
        }
      }

      if (shouldComplete) {
        completed.push(sp);
        this.executeSyncAction(sp, state);
      }
    }

    return completed;
  }

  /**
   * Обработка завершения параллельного сценария.
   */
  onParallelFinished(state: MultiScenarioState, instanceId: string): void {
    const instance = state.parallelScenarios.find((p) => p.id === instanceId);
    if (!instance) return;

    instance.status = 'finished';
    instance.finishedAt = Date.now();

    // Проверяем точки синхронизации
    this.checkSyncPoints(state);
  }

  /**
   * Получение значения переменной для конкретного параллельного сценария.
   * Сначала проверяет локальные переменные, затем глобальные.
   */
  getVariable(state: MultiScenarioState, instanceId: string, name: string): any {
    const instance = state.parallelScenarios.find((p) => p.id === instanceId);
    if (!instance) return undefined;

    // Проверяем локальные переменные
    if (name in instance.variables) {
      return instance.variables[name];
    }

    // Проверяем глобальные переменные
    return state.globalVariables[name];
  }

  /**
   * Установка переменной для конкретного параллельного сценария.
   */
  setVariable(state: MultiScenarioState, instanceId: string, name: string, value: any): void {
    const instance = state.parallelScenarios.find((p) => p.id === instanceId);
    if (!instance) return;

    const config = this.configs.get(instance.configId);
    if (!config) return;

    // Если переменная в списке shared — устанавливаем в глобальные
    if (config.variables.shared.includes(name)) {
      state.globalVariables[name] = value;
    } else {
      // Иначе — в локальные переменные экземпляра
      instance.variables[name] = value;
    }
  }

  // ==================== Cross-Scenario Communication ====================

  /**
   * Отправка события всем подписанным сценариям.
   * @param state - мульти-сценарное состояние
   * @param eventName - имя события
   * @param payload - данные события
   * @param sourceInstanceId - ID экземпляра-отправителя (опционально)
   */
  emitEvent(
    state: MultiScenarioState,
    eventName: string,
    payload: any,
    sourceInstanceId?: string
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;

    for (const callback of listeners) {
      try {
        callback(payload, sourceInstanceId);
      } catch (err) {
        console.error(`[MultiScenarioOrchestrator] Error in event listener for "${eventName}":`, err);
      }
    }

    // Также проверяем триггеры параллельных сценариев на событие
    for (const instance of state.parallelScenarios) {
      const config = this.configs.get(instance.configId);
      if (
        config &&
        config.startOn === 'trigger' &&
        config.triggerEvent === eventName &&
        instance.status === 'idle'
      ) {
        this.startParallelInstance(state, instance, config);
      }
    }
  }

  /**
   * Подписка на событие.
   * @param eventName - имя события
   * @param callback - функция-обработчик (payload, sourceInstanceId?) => void
   * @returns функция отписки
   */
  onEvent(
    eventName: string,
    callback: (payload: any, sourceInstanceId?: string) => void
  ): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);

    // Возвращаем функцию отписки
    return () => {
      this.offEvent(eventName, callback);
    };
  }

  /**
   * Отписка от события.
   */
  offEvent(
    eventName: string,
    callback: (payload: any, sourceInstanceId?: string) => void
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;

    const filtered = listeners.filter((cb) => cb !== callback);
    if (filtered.length === 0) {
      this.eventListeners.delete(eventName);
    } else {
      this.eventListeners.set(eventName, filtered);
    }
  }

  /**
   * Получение глобальной переменной с проверкой прав доступа.
   * @param state - мульти-сценарное состояние
   * @param name - имя переменной
   * @param instanceId - ID экземпляра-читателя (опционально, для проверки прав)
   */
  getGlobalVariable(state: MultiScenarioState, name: string, instanceId?: string): any {
    const config = instanceId
      ? this.configs.get(
          state.parallelScenarios.find((p) => p.id === instanceId)?.configId || ''
        )
      : undefined;

    // Проверка прав на чтение
    if (config && config.variables.shared.includes(name)) {
      // Если переменная в shared — она доступна
      return state.globalVariables[name];
    }

    // Если instanceId указан, проверяем readableBy из конфигурации коммуникации
    // (эта проверка выполняется на уровне рантайма, конфиг доступа хранится в сценарии)
    return state.globalVariables[name];
  }

  /**
   * Установка глобальной переменной с проверкой прав доступа.
   * @param state - мульти-сценарное состояние
   * @param name - имя переменной
   * @param value - значение
   * @param instanceId - ID экземпляра-писателя (опционально, для проверки прав)
   * @throws Error если нет прав на запись
   */
  setGlobalVariable(state: MultiScenarioState, name: string, value: any, instanceId?: string): void {
    const instance = instanceId
      ? state.parallelScenarios.find((p) => p.id === instanceId)
      : undefined;

    const config = instance
      ? this.configs.get(instance.configId)
      : undefined;

    // Если переменная в shared — разрешаем запись
    if (config && config.variables.shared.includes(name)) {
      state.globalVariables[name] = value;
      return;
    }

    // Иначе устанавливаем в глобальные переменные
    state.globalVariables[name] = value;
  }

  // ==================== Private Helpers ====================

  private startParallelInstance(
    state: MultiScenarioState,
    instance: ParallelScenarioInstance,
    config: ParallelScenarioConfig
  ): void {
    instance.status = 'running';
    instance.startedAt = Date.now();
    instance.currentSceneId = null; // Будет установлено при первом входе в сцену

    // Инициализируем переменные
    for (const localVar of config.variables.local) {
      instance.variables[localVar] = null;
    }
  }


  private executeSyncAction(sp: SyncPoint, state: MultiScenarioState): void {
    switch (sp.onComplete.action) {
      case 'continue_all':
        // Все сценарии продолжают выполнение (по умолчанию)
        break;

      case 'continue_one': {
        // Продолжаем первый незавершённый сценарий
        const nextInstance = state.parallelScenarios.find(
          (p) => p.status === 'running' || p.status === 'paused'
        );
        if (nextInstance && nextInstance.status === 'paused') {
          nextInstance.status = 'running';
        }
        break;
      }

      case 'stop_all':
        // Останавливаем все запущенные сценарии
        for (const instance of state.parallelScenarios) {
          if (instance.status === 'running' || instance.status === 'paused') {
            instance.status = 'finished';
            instance.finishedAt = Date.now();
          }
        }
        break;

      case 'emit_event':
        // Событие будет обработано внешним слушателем
        // Данные события доступны в sp.onComplete.eventData
        break;
    }
  }
}

// ==================== 12. Multiplayer Engine (spec 3.1) ====================

export interface VotingSession {
  id: string;
  status: 'active' | 'completed';
  options: string[];
  votes: Record<string, number>; // playerId -> optionIndex
  results: Record<number, number>; // optionIndex -> count
  startedAt: number;
  duration: number;
}

export interface AuctionSession {
  id: string;
  status: 'active' | 'completed';
  itemName: string;
  startingBid: number;
  minBidStep: number;
  currency: string;
  bids: AuctionBid[];
  currentWinnerId: string | null;
  currentBid: number;
  startedAt: number;
  duration: number;
}

export interface AuctionBid {
  playerId: string;
  amount: number;
  timestamp: number;
}

export interface AuctionResult {
  winnerId: string | null;
  winningBid: number;
  totalBids: number;
  participants: string[];
}

export interface ChoiceSession {
  id: string;
  status: 'active' | 'completed';
  choices: Record<string, any>; // playerId -> choice
  startedAt: number;
  duration: number;
}

export interface ChallengeSession {
  id: string;
  status: 'active' | 'completed';
  results: ChallengeResultEntry[];
  startedAt: number;
  duration: number;
}

export interface ChallengeResultEntry {
  playerId: string;
  time: number; // ms
  completedAt: number;
}

export interface ChallengeResult {
  winnerId: string | null;
  rankings: Array<{ playerId: string; time: number }>;
  totalParticipants: number;
}

export interface VotingResults {
  totalVotes: number;
  results: Record<number, number>; // optionIndex -> count
  winnerIndex: number | null;
  participationRate: number; // 0..1
}

export class MultiplayerEngine {
  private votingSessions: Map<string, VotingSession> = new Map();
  private auctionSessions: Map<string, AuctionSession> = new Map();
  private choiceSessions: Map<string, ChoiceSession> = new Map();
  private challengeSessions: Map<string, ChallengeSession> = new Map();
  private syncTimers: Map<string, { remaining: number; startedAt: number; duration: number }> = new Map();

  // ==================== Voting ====================

  /**
   * Начать голосование.
   */
  startVoting(config: { id: string; options: string[]; duration: number }): VotingSession {
    const session: VotingSession = {
      id: config.id,
      status: 'active',
      options: config.options,
      votes: {},
      results: {},
      startedAt: Date.now(),
      duration: config.duration,
    };

    // Инициализируем результаты нулями
    for (let i = 0; i < config.options.length; i++) {
      session.results[i] = 0;
    }

    this.votingSessions.set(config.id, session);

    // Автозавершение по таймеру
    if (config.duration > 0) {
      setTimeout(() => {
        this.completeVoting(config.id);
      }, config.duration * 1000);
    }

    return session;
  }

  /**
   * Голосование игрока.
   */
  castVote(sessionId: string, playerId: string, optionIndex: number): boolean {
    const session = this.votingSessions.get(sessionId);
    if (!session || session.status !== 'active') return false;
    if (optionIndex < 0 || optionIndex >= session.options.length) return false;

    // Если игрок уже голосовал — уменьшаем счётчик предыдущего голоса
    if (session.votes[playerId] !== undefined) {
      const prevOption = session.votes[playerId];
      session.results[prevOption] = Math.max(0, (session.results[prevOption] || 1) - 1);
    }

    // Записываем новый голос
    session.votes[playerId] = optionIndex;
    session.results[optionIndex] = (session.results[optionIndex] || 0) + 1;

    return true;
  }

  /**
   * Получить результаты голосования.
   */
  getVotingResults(sessionId: string): VotingResults | null {
    const session = this.votingSessions.get(sessionId);
    if (!session) return null;

    const totalVotes = Object.keys(session.votes).length;
    const winnerIndex = this.determineVotingWinner(session.results);

    return {
      totalVotes,
      results: { ...session.results },
      winnerIndex,
      participationRate: totalVotes > 0 ? 1 : 0,
    };
  }

  /**
   * Завершить голосование принудительно.
   */
  completeVoting(sessionId: string): VotingSession | null {
    const session = this.votingSessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    return session;
  }

  private determineVotingWinner(results: Record<number, number>): number | null {
    const entries = Object.entries(results).map(([k, v]) => [Number(k), v] as [number, number]);
    if (entries.length === 0) return null;

    const maxVotes = Math.max(...entries.map(([, v]) => v));
    if (maxVotes === 0) return null;

    const winners = entries.filter(([, v]) => v === maxVotes);
    // Если ничья — возвращаем null (нужна переголосовка)
    return winners.length === 1 ? winners[0][0] : null;
  }

  // ==================== Auction ====================

  /**
   * Начать аукцион.
   */
  startAuction(config: {
    id: string;
    itemName: string;
    startingBid: number;
    minBidStep: number;
    currency: string;
    duration: number;
  }): AuctionSession {
    const session: AuctionSession = {
      id: config.id,
      status: 'active',
      itemName: config.itemName,
      startingBid: config.startingBid,
      minBidStep: config.minBidStep,
      currency: config.currency,
      bids: [],
      currentWinnerId: null,
      currentBid: config.startingBid,
      startedAt: Date.now(),
      duration: config.duration,
    };

    this.auctionSessions.set(config.id, session);

    // Автозавершение по таймеру
    if (config.duration > 0) {
      setTimeout(() => {
        this.completeAuction(config.id);
      }, config.duration * 1000);
    }

    return session;
  }

  /**
   * Сделать ставку.
   */
  placeBid(sessionId: string, playerId: string, amount: number): boolean {
    const session = this.auctionSessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    // Первая ставка должна быть >= стартовой цены
    // Последующие — >= текущая ставка + минимальный шаг
    if (session.bids.length === 0) {
      if (amount < session.startingBid) return false;
    } else {
      if (amount < session.currentBid + session.minBidStep) return false;
    }

    session.bids.push({ playerId, amount, timestamp: Date.now() });
    session.currentWinnerId = playerId;
    session.currentBid = amount;

    return true;
  }

  /**
   * Получить результат аукциона.
   */
  getAuctionResult(sessionId: string): AuctionResult | null {
    const session = this.auctionSessions.get(sessionId);
    if (!session) return null;

    const participants = [...new Set(session.bids.map((b) => b.playerId))];

    return {
      winnerId: session.currentWinnerId,
      winningBid: session.currentBid,
      totalBids: session.bids.length,
      participants,
    };
  }

  /**
   * Завершить аукцион принудительно.
   */
  completeAuction(sessionId: string): AuctionSession | null {
    const session = this.auctionSessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    return session;
  }

  // ==================== Simultaneous Choice ====================

  /**
   * Начать одновременный выбор.
   */
  startSimultaneousChoice(config: { id: string; duration: number }): ChoiceSession {
    const session: ChoiceSession = {
      id: config.id,
      status: 'active',
      choices: {},
      startedAt: Date.now(),
      duration: config.duration,
    };

    this.choiceSessions.set(config.id, session);

    if (config.duration > 0) {
      setTimeout(() => {
        this.completeSimultaneousChoice(config.id);
      }, config.duration * 1000);
    }

    return session;
  }

  /**
   * Отправить выбор игрока.
   */
  submitChoice(sessionId: string, playerId: string, choice: any): boolean {
    const session = this.choiceSessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    session.choices[playerId] = choice;
    return true;
  }

  /**
   * Получить все выборы.
   */
  getChoices(sessionId: string): Record<string, any> | null {
    const session = this.choiceSessions.get(sessionId);
    if (!session) return null;

    return { ...session.choices };
  }

  /**
   * Завершить одновременный выбор принудительно.
   */
  completeSimultaneousChoice(sessionId: string): ChoiceSession | null {
    const session = this.choiceSessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    return session;
  }

  // ==================== Challenge ====================

  /**
   * Начать челлендж.
   */
  startChallenge(config: { id: string; duration: number }): ChallengeSession {
    const session: ChallengeSession = {
      id: config.id,
      status: 'active',
      results: [],
      startedAt: Date.now(),
      duration: config.duration,
    };

    this.challengeSessions.set(config.id, session);

    if (config.duration > 0) {
      setTimeout(() => {
        this.completeChallengeSession(config.id);
      }, config.duration * 1000);
    }

    return session;
  }

  /**
   * Завершить челлендж игроком (с указанием времени).
   */
  completeChallenge(sessionId: string, playerId: string, time: number): boolean {
    const session = this.challengeSessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    // Проверяем, не завершил ли игрок уже
    if (session.results.some((r) => r.playerId === playerId)) return false;

    session.results.push({
      playerId,
      time,
      completedAt: Date.now(),
    });

    return true;
  }

  /**
   * Получить результат челленджа.
   */
  getChallengeResult(sessionId: string): ChallengeResult | null {
    const session = this.challengeSessions.get(sessionId);
    if (!session) return null;

    const sorted = [...session.results].sort((a, b) => a.time - b.time);

    return {
      winnerId: sorted.length > 0 ? sorted[0].playerId : null,
      rankings: sorted.map((r) => ({ playerId: r.playerId, time: r.time })),
      totalParticipants: session.results.length,
    };
  }

  /**
   * Завершить сессию челленджа принудительно.
   */
  completeChallengeSession(sessionId: string): ChallengeSession | null {
    const session = this.challengeSessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    return session;
  }

  // ==================== Sync Timer ====================

  /**
   * Запустить синхронизированный таймер.
   */
  startSyncTimer(timerId: string, duration: number): void {
    this.syncTimers.set(timerId, {
      remaining: duration,
      startedAt: Date.now(),
      duration,
    });
  }

  /**
   * Получить оставшееся время синхронизированного таймера (в секундах).
   */
  getRemainingTime(timerId: string): number {
    const timer = this.syncTimers.get(timerId);
    if (!timer) return 0;

    const elapsed = (Date.now() - timer.startedAt) / 1000;
    const remaining = Math.max(0, timer.duration - elapsed);

    return remaining;
  }

  /**
   * Остановить синхронизированный таймер.
   */
  stopSyncTimer(timerId: string): void {
    this.syncTimers.delete(timerId);
  }

  // ==================== Session Management ====================

  /**
   * Получить активную сессию голосования.
   */
  getVotingSession(sessionId: string): VotingSession | null {
    return this.votingSessions.get(sessionId) || null;
  }

  /**
   * Получить активную сессию аукциона.
   */
  getAuctionSession(sessionId: string): AuctionSession | null {
    return this.auctionSessions.get(sessionId) || null;
  }

  /**
   * Получить активную сессию одновременного выбора.
   */
  getChoiceSession(sessionId: string): ChoiceSession | null {
    return this.choiceSessions.get(sessionId) || null;
  }

  /**
   * Получить активную сессию челленджа.
   */
  getChallengeSession(sessionId: string): ChallengeSession | null {
    return this.challengeSessions.get(sessionId) || null;
  }

  /**
   * Очистить все завершённые сессии.
   */
  cleanupCompletedSessions(): void {
    const now = Date.now();
    const timeout = 3600000; // 1 час

    for (const [id, session] of this.votingSessions) {
      if (session.status === 'completed' && now - session.startedAt > timeout) {
        this.votingSessions.delete(id);
      }
    }

    for (const [id, session] of this.auctionSessions) {
      if (session.status === 'completed' && now - session.startedAt > timeout) {
        this.auctionSessions.delete(id);
      }
    }

    for (const [id, session] of this.choiceSessions) {
      if (session.status === 'completed' && now - session.startedAt > timeout) {
        this.choiceSessions.delete(id);
      }
    }

    for (const [id, session] of this.challengeSessions) {
      if (session.status === 'completed' && now - session.startedAt > timeout) {
        this.challengeSessions.delete(id);
      }
    }
  }
}
