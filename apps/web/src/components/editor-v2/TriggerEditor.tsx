'use client';

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import {
  TriggerDefinition,
  TriggerAction,
  TriggerEventType,
  TRIGGER_EVENT_ICONS,
  TRIGGER_EVENT_LABELS,
  Condition,
  ConditionGroup,
} from '@/lib/editor-store/editor.types';
import ConditionBuilder from './ConditionBuilder';

// ==================== Types ====================

interface TriggerEditorProps {
  onClose: () => void;
}

// ==================== Constants ====================

const TRIGGER_EVENTS: { value: TriggerEventType; label: string; icon: string; group: string }[] = [
  { value: 'onSceneEnter', label: 'Вход в сцену', icon: '🚪', group: 'Сцены' },
  { value: 'onSceneExit', label: 'Выход из сцены', icon: '🚶', group: 'Сцены' },
  { value: 'onMissionStart', label: 'Начало миссии', icon: '🎯', group: 'Миссии' },
  { value: 'onMissionComplete', label: 'Завершение миссии', icon: '✅', group: 'Миссии' },
  { value: 'onMissionFail', label: 'Провал миссии', icon: '❌', group: 'Миссии' },
  { value: 'onAnswerCorrect', label: 'Правильный ответ', icon: '👍', group: 'Ответы' },
  { value: 'onAnswerWrong', label: 'Неправильный ответ', icon: '👎', group: 'Ответы' },
  { value: 'onTimerStart', label: 'Таймер запущен', icon: '⏱️', group: 'Таймеры' },
  { value: 'onTimerEnd', label: 'Таймер истёк', icon: '⏰', group: 'Таймеры' },
  { value: 'onItemGet', label: 'Получение предмета', icon: '📦', group: 'Инвентарь' },
  { value: 'onItemSpend', label: 'Трата предмета', icon: '💸', group: 'Инвентарь' },
  { value: 'onAchievementUnlock', label: 'Достижение', icon: '🏆', group: 'Достижения' },
  { value: 'onRoleAssigned', label: 'Назначение роли', icon: '👤', group: 'Роли' },
  { value: 'onVariableChange', label: 'Изменение переменной', icon: '📊', group: 'Переменные' },
  { value: 'onCustomEvent', label: 'Пользовательское событие', icon: '🔔', group: 'Прочее' },
];

const ACTION_TYPES: { value: TriggerAction['type']; label: string; icon: string }[] = [
  { value: 'set_variable', label: 'Установить переменную', icon: '📊' },
  { value: 'add_score', label: 'Добавить очки', icon: '⭐' },
  { value: 'teleport', label: 'Телепорт', icon: '📍' },
  { value: 'show_notification', label: 'Уведомление', icon: '🔔' },
  { value: 'start_timer', label: 'Запустить таймер', icon: '⏱️' },
  { value: 'stop_timer', label: 'Остановить таймер', icon: '⏹️' },
  { value: 'play_sound', label: 'Воспроизвести звук', icon: '🔊' },
  { value: 'show_modal', label: 'Показать модалку', icon: '🪟' },
  { value: 'assign_role', label: 'Назначить роль', icon: '👤' },
  { value: 'give_item', label: 'Выдать предмет', icon: '🎁' },
  { value: 'remove_item', label: 'Удалить предмет', icon: '🗑️' },
  { value: 'emit_event', label: 'Отправить событие', icon: '📡' },
  { value: 'call_api', label: 'API-запрос', icon: '🌐' },
];

// ==================== Helpers ====================

function createEmptyTrigger(): TriggerDefinition {
  return {
    id: uuidv4(),
    name: '',
    description: '',
    event: 'onSceneEnter',
    conditions: { operator: 'AND', conditions: [] },
    actions: [],
    enabled: true,
    cooldown: 0,
    maxFires: 0,
    fireCount: 0,
  };
}

function createEmptyAction(): TriggerAction {
  return {
    id: uuidv4(),
    type: 'set_variable',
    config: {},
  };
}

function getActionConfigFields(type: TriggerAction['type']): { key: string; label: string; type: 'text' | 'number' | 'select'; options?: { value: string; label: string }[] }[] {
  switch (type) {
    case 'set_variable':
      return [
        { key: 'variableName', label: 'Имя переменной', type: 'text' },
        { key: 'value', label: 'Значение', type: 'text' },
        { key: 'operation', label: 'Операция', type: 'select', options: [
          { value: 'set', label: 'Установить' },
          { value: 'add', label: 'Прибавить' },
          { value: 'subtract', label: 'Вычесть' },
        ]},
      ];
    case 'add_score':
      return [
        { key: 'amount', label: 'Количество', type: 'number' },
      ];
    case 'teleport':
      return [
        { key: 'sceneId', label: 'ID сцены', type: 'text' },
      ];
    case 'show_notification':
      return [
        { key: 'text', label: 'Текст уведомления', type: 'text' },
        { key: 'icon', label: 'Иконка', type: 'text' },
        { key: 'duration', label: 'Длительность (сек)', type: 'number' },
      ];
    case 'start_timer':
      return [
        { key: 'timerId', label: 'ID таймера', type: 'text' },
        { key: 'duration', label: 'Длительность (сек)', type: 'number' },
      ];
    case 'stop_timer':
      return [
        { key: 'timerId', label: 'ID таймера', type: 'text' },
      ];
    case 'play_sound':
      return [
        { key: 'assetId', label: 'ID ассета', type: 'text' },
        { key: 'loop', label: 'Зациклить', type: 'select', options: [
          { value: 'true', label: 'Да' },
          { value: 'false', label: 'Нет' },
        ]},
      ];
    case 'show_modal':
      return [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'text', label: 'Текст', type: 'text' },
      ];
    case 'assign_role':
      return [
        { key: 'roleId', label: 'ID роли', type: 'text' },
        { key: 'playerId', label: 'ID игрока (опц.)', type: 'text' },
      ];
    case 'give_item':
      return [
        { key: 'itemId', label: 'ID предмета', type: 'text' },
        { key: 'quantity', label: 'Количество', type: 'number' },
      ];
    case 'remove_item':
      return [
        { key: 'itemId', label: 'ID предмета', type: 'text' },
        { key: 'quantity', label: 'Количество', type: 'number' },
      ];
    case 'emit_event':
      return [
        { key: 'eventName', label: 'Имя события', type: 'text' },
        { key: 'data', label: 'Данные (JSON)', type: 'text' },
      ];
    case 'call_api':
      return [
        { key: 'url', label: 'URL', type: 'text' },
        { key: 'method', label: 'Метод', type: 'select', options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
        ]},
        { key: 'body', label: 'Тело запроса', type: 'text' },
      ];
    default:
      return [];
  }
}

function getEventFilterFields(event: TriggerEventType): { key: string; label: string; placeholder: string }[] {
  switch (event) {
    case 'onSceneEnter':
    case 'onSceneExit':
      return [{ key: 'sceneId', label: 'ID сцены', placeholder: 'Оставить пустым для всех сцен' }];
    case 'onMissionStart':
    case 'onMissionComplete':
    case 'onMissionFail':
      return [
        { key: 'sceneId', label: 'ID сцены', placeholder: 'Оставить пустым' },
        { key: 'missionId', label: 'ID миссии', placeholder: 'Оставить пустым' },
      ];
    case 'onAnswerCorrect':
    case 'onAnswerWrong':
      return [
        { key: 'sceneId', label: 'ID сцены', placeholder: 'Оставить пустым' },
        { key: 'missionId', label: 'ID миссии', placeholder: 'Оставить пустым' },
      ];
    case 'onItemGet':
    case 'onItemSpend':
      return [{ key: 'itemId', label: 'ID предмета', placeholder: 'Оставить пустым для всех' }];
    case 'onAchievementUnlock':
      return [{ key: 'itemId', label: 'ID достижения', placeholder: 'Оставить пустым' }];
    case 'onRoleAssigned':
      return [{ key: 'roleId', label: 'ID роли', placeholder: 'Оставить пустым' }];
    case 'onVariableChange':
      return [{ key: 'variableName', label: 'Имя переменной', placeholder: 'Оставить пустым' }];
    default:
      return [];
  }
}

// ==================== ActionEditor Component ====================

interface ActionEditorProps {
  action: TriggerAction;
  onChange: (action: TriggerAction) => void;
  onDelete: () => void;
}

function ActionEditor({ action, onChange, onDelete }: ActionEditorProps) {
  const fields = getActionConfigFields(action.type);

  const handleTypeChange = useCallback((type: TriggerAction['type']) => {
    onChange({ ...action, type, config: {} });
  }, [action, onChange]);

  const handleConfigChange = useCallback((key: string, value: any) => {
    onChange({ ...action, config: { ...action.config, [key]: value } });
  }, [action, onChange]);

  return (
    <div className="p-3 rounded-lg bg-background-modifier-hover/30 border border-border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={action.type}
            onChange={(e) => handleTypeChange(e.target.value as TriggerAction['type'])}
            className="input-field text-xs flex-1"
          >
            {ACTION_TYPES.map((at) => (
              <option key={at.value} value={at.value}>
                {at.icon} {at.label}
              </option>
            ))}
          </select>
          <button
            onClick={onDelete}
            className="text-text-secondary hover:text-error transition-colors text-sm shrink-0 p-1"
            title="Удалить действие"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Поля конфигурации */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-0.5">
            <label className="text-[10px] text-text-secondary font-medium">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={String(action.config[field.key] ?? field.options?.[0]?.value ?? '')}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
                className="input-field text-xs"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={String(action.config[field.key] ?? '')}
                onChange={(e) => handleConfigChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                className="input-field text-xs"
                placeholder={field.label}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== TriggerForm Component ====================

interface TriggerFormProps {
  trigger: TriggerDefinition;
  onChange: (trigger: TriggerDefinition) => void;
}

function TriggerForm({ trigger, onChange }: TriggerFormProps) {
  const eventFilterFields = getEventFilterFields(trigger.event);

  const handleAddAction = useCallback(() => {
    onChange({
      ...trigger,
      actions: [...trigger.actions, createEmptyAction()],
    });
  }, [trigger, onChange]);

  const handleUpdateAction = useCallback((index: number, action: TriggerAction) => {
    const newActions = [...trigger.actions];
    newActions[index] = action;
    onChange({ ...trigger, actions: newActions });
  }, [trigger, onChange]);

  const handleRemoveAction = useCallback((index: number) => {
    onChange({
      ...trigger,
      actions: trigger.actions.filter((_, i) => i !== index),
    });
  }, [trigger, onChange]);

  const handleMoveAction = useCallback((index: number, direction: 'up' | 'down') => {
    const newActions = [...trigger.actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newActions.length) return;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
    onChange({ ...trigger, actions: newActions });
  }, [trigger, onChange]);

  const handleConditionsChange = useCallback((condition: Condition | null) => {
    if (condition && 'operator' in condition && 'conditions' in condition) {
      onChange({ ...trigger, conditions: condition as ConditionGroup });
    } else {
      onChange({ ...trigger, conditions: { operator: 'AND', conditions: [] } });
    }
  }, [trigger, onChange]);

  const handleEventFilterChange = useCallback((key: string, value: string) => {
    onChange({
      ...trigger,
      eventFilter: { ...(trigger.eventFilter || {}), [key]: value || undefined },
    });
  }, [trigger, onChange]);

  return (
    <div className="space-y-4">
      {/* Название и описание */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">Название</label>
          <input
            type="text"
            value={trigger.name}
            onChange={(e) => onChange({ ...trigger, name: e.target.value })}
            className="input-field text-sm"
            placeholder="Название триггера"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">Описание</label>
          <input
            type="text"
            value={trigger.description}
            onChange={(e) => onChange({ ...trigger, description: e.target.value })}
            className="input-field text-sm"
            placeholder="Описание (опционально)"
          />
        </div>
      </div>

      {/* Событие */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">Событие</label>
        <select
          value={trigger.event}
          onChange={(e) => onChange({ ...trigger, event: e.target.value as TriggerEventType })}
          className="input-field text-sm"
        >
          {TRIGGER_EVENTS.map((ev) => (
            <option key={ev.value} value={ev.value}>
              {ev.icon} {ev.label}
            </option>
          ))}
        </select>
      </div>

      {/* Фильтр события */}
      {eventFilterFields.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">Фильтр события (опционально)</label>
          <div className="grid grid-cols-2 gap-2">
            {eventFilterFields.map((field) => (
              <input
                key={field.key}
                type="text"
                value={(trigger.eventFilter as any)?.[field.key] ?? ''}
                onChange={(e) => handleEventFilterChange(field.key, e.target.value)}
                className="input-field text-xs"
                placeholder={field.placeholder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Условия */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">Условия срабатывания</label>
        <div className="p-3 rounded-lg bg-background-modifier-hover/20 border border-border">
          <ConditionBuilder
            value={trigger.conditions.conditions.length > 0 ? trigger.conditions : null}
            onChange={handleConditionsChange}
            title="Условия триггера"
            mode="full"
          />
        </div>
      </div>

      {/* Действия */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary">Действия ({trigger.actions.length})</label>
          <button
            onClick={handleAddAction}
            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            + Добавить действие
          </button>
        </div>
        {trigger.actions.length === 0 ? (
          <div className="text-xs text-text-secondary text-center py-4 bg-background-modifier-hover/20 rounded-lg border border-dashed border-border">
            Нет действий. Нажмите &laquo;+ Добавить действие&raquo;
          </div>
        ) : (
          <div className="space-y-2">
            {trigger.actions.map((action, index) => (
              <div key={action.id} className="relative">
                {/* Порядковый номер и кнопки перемещения */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] text-text-secondary font-mono">#{index + 1}</span>
                  <button
                    onClick={() => handleMoveAction(index, 'up')}
                    disabled={index === 0}
                    className="text-text-secondary hover:text-text-primary disabled:opacity-30 text-xs p-0.5"
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveAction(index, 'down')}
                    disabled={index === trigger.actions.length - 1}
                    className="text-text-secondary hover:text-text-primary disabled:opacity-30 text-xs p-0.5"
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                </div>
                <ActionEditor
                  action={action}
                  onChange={(a) => handleUpdateAction(index, a)}
                  onDelete={() => handleRemoveAction(index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Настройки */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">Настройки</label>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={trigger.enabled}
              onChange={(e) => onChange({ ...trigger, enabled: e.target.checked })}
              className="rounded"
              id="trigger-enabled"
            />
            <label htmlFor="trigger-enabled" className="text-xs text-text-secondary">Включён</label>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-text-secondary">Кулдаун (сек)</label>
            <input
              type="number"
              value={trigger.cooldown}
              onChange={(e) => onChange({ ...trigger, cooldown: Math.max(0, Number(e.target.value)) })}
              className="input-field text-xs"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-text-secondary">Макс. срабатываний</label>
            <input
              type="number"
              value={trigger.maxFires}
              onChange={(e) => onChange({ ...trigger, maxFires: Math.max(0, Number(e.target.value)) })}
              className="input-field text-xs"
              min={0}
              placeholder="0 = безлимит"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TriggerEditor Component ====================

export default function TriggerEditor({ onClose }: TriggerEditorProps) {
  const triggers = useEditorStore((s) => s.triggers);
  const addTrigger = useEditorStore((s) => s.addTrigger);
  const updateTrigger = useEditorStore((s) => s.updateTrigger);
  const removeTrigger = useEditorStore((s) => s.removeTrigger);
  const duplicateTrigger = useEditorStore((s) => s.duplicateTrigger);
  const toggleTrigger = useEditorStore((s) => s.toggleTrigger);
  const resetTriggerFireCount = useEditorStore((s) => s.resetTriggerFireCount);

  const [editingTrigger, setEditingTrigger] = useState<TriggerDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredTriggers = useMemo(() => {
    if (filterEvent === 'all') return triggers;
    return triggers.filter((t) => t.event === filterEvent);
  }, [triggers, filterEvent]);

  const activeCount = useMemo(() => triggers.filter((t) => t.enabled).length, [triggers]);

  const handleCreate = useCallback(() => {
    const newTrigger = createEmptyTrigger();
    setEditingTrigger(newTrigger);
    setIsCreating(true);
  }, []);

  const handleEdit = useCallback((trigger: TriggerDefinition) => {
    setEditingTrigger(JSON.parse(JSON.stringify(trigger)));
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingTrigger) return;
    if (isCreating) {
      addTrigger(editingTrigger);
    } else {
      updateTrigger(editingTrigger.id, editingTrigger);
    }
    setEditingTrigger(null);
  }, [editingTrigger, isCreating, addTrigger, updateTrigger]);

  const handleDelete = useCallback((triggerId: string) => {
    removeTrigger(triggerId);
    setShowDeleteConfirm(null);
  }, [removeTrigger]);

  const handleDuplicate = useCallback((triggerId: string) => {
    duplicateTrigger(triggerId);
  }, [duplicateTrigger]);

  const handleToggle = useCallback((triggerId: string) => {
    toggleTrigger(triggerId);
  }, [toggleTrigger]);

  const handleResetCount = useCallback((triggerId: string) => {
    resetTriggerFireCount(triggerId);
  }, [resetTriggerFireCount]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl mx-4 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-semibold text-text-primary">
              Редактор триггеров
            </h2>
            <span className="text-xs text-text-secondary bg-background-modifier-hover/50 px-2 py-0.5 rounded-full">
              {activeCount}/{triggers.length} активны
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
          >
            ✕
          </button>
        </div>

        {editingTrigger ? (
          /* ===== Редактор триггера ===== */
          <div className="flex-1 overflow-y-auto p-4">
            <TriggerForm
              trigger={editingTrigger}
              onChange={setEditingTrigger}
            />
          </div>
        ) : (
          /* ===== Список триггеров ===== */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Фильтр и кнопка добавления */}
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="all">🔽 Все события</option>
                  {TRIGGER_EVENTS.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.icon} {ev.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                className="btn-primary text-xs px-3 py-1.5"
              >
                ➕ Добавить триггер
              </button>
            </div>

            {/* Таблица триггеров */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredTriggers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">⚡</span>
                  <p className="text-sm font-medium text-text-primary mb-1">Нет триггеров</p>
                  <p className="text-xs text-text-secondary mb-4">
                    {filterEvent !== 'all'
                      ? 'Нет триггеров для выбранного события'
                      : 'Создайте первый триггер, чтобы сценарий реагировал на действия игроков'}
                  </p>
                  {filterEvent === 'all' && (
                    <button
                      onClick={handleCreate}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                    >
                      ➕ Создать триггер
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-secondary border-b border-border">
                      <th className="text-left py-2 px-1 w-8"></th>
                      <th className="text-left py-2 px-2">Название</th>
                      <th className="text-left py-2 px-2">Событие</th>
                      <th className="text-left py-2 px-2">Условия</th>
                      <th className="text-left py-2 px-2">Действия</th>
                      <th className="text-left py-2 px-2">Кулдаун</th>
                      <th className="text-left py-2 px-2">Срабатываний</th>
                      <th className="text-right py-2 px-1 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTriggers.map((trigger) => (
                      <tr
                        key={trigger.id}
                        className="border-b border-border/50 hover:bg-background-modifier-hover/30 transition-colors group"
                      >
                        {/* Вкл/Выкл */}
                        <td className="py-2 px-1">
                          <button
                            onClick={() => handleToggle(trigger.id)}
                            className={`text-sm transition-colors ${
                              trigger.enabled ? 'text-green-500' : 'text-text-secondary opacity-40'
                            }`}
                            title={trigger.enabled ? 'Выключить' : 'Включить'}
                          >
                            {trigger.enabled ? '⚡' : '⚡'}
                          </button>
                        </td>

                        {/* Название */}
                        <td className="py-2 px-2">
                          <button
                            onClick={() => handleEdit(trigger)}
                            className="text-text-primary font-medium hover:text-primary transition-colors text-left"
                          >
                            {trigger.name || <span className="text-text-secondary italic">Без названия</span>}
                          </button>
                          {trigger.description && (
                            <p className="text-[10px] text-text-secondary truncate max-w-[150px]">{trigger.description}</p>
                          )}
                        </td>

                        {/* Событие */}
                        <td className="py-2 px-2">
                          <span className="text-text-primary">
                            {TRIGGER_EVENT_ICONS[trigger.event]} {TRIGGER_EVENT_LABELS[trigger.event]}
                          </span>
                        </td>

                        {/* Условия */}
                        <td className="py-2 px-2">
                          {trigger.conditions.conditions.length > 0 ? (
                            <span className="text-green-500">{trigger.conditions.conditions.length} усл.</span>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>

                        {/* Действия */}
                        <td className="py-2 px-2">
                          <span className="text-text-primary">{trigger.actions.length} действ.</span>
                        </td>

                        {/* Кулдаун */}
                        <td className="py-2 px-2">
                          <span className="text-text-secondary">
                            {trigger.cooldown > 0 ? `${trigger.cooldown}с` : '—'}
                          </span>
                        </td>

                        {/* Срабатываний */}
                        <td className="py-2 px-2">
                          <span className="text-text-secondary">
                            {trigger.fireCount}
                            {trigger.maxFires > 0 ? `/${trigger.maxFires}` : ''}
                          </span>
                        </td>

                        {/* Действия */}
                        <td className="py-2 px-1">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => handleEdit(trigger)}
                              className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background-modifier-hover text-xs"
                              title="Редактировать"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDuplicate(trigger.id)}
                              className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background-modifier-hover text-xs"
                              title="Дублировать"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => handleResetCount(trigger.id)}
                              className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background-modifier-hover text-xs"
                              title="Сбросить счётчик срабатываний"
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(trigger.id)}
                              className="text-text-secondary hover:text-error p-1 rounded hover:bg-error/10 text-xs"
                              title="Удалить"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
          {editingTrigger ? (
            <>
              <button
                onClick={() => setEditingTrigger(null)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
              >
                ← Назад к списку
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingTrigger(null)}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  💾 {isCreating ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors ml-auto"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-scale-in p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Удалить триггер?</h3>
              <p className="text-sm text-text-secondary">
                Это действие нельзя отменить. Триггер будет удалён навсегда.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}