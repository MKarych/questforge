'use client';

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import {
  ParallelScenarioConfig,
  SyncPoint,
  ConditionGroup,
} from '@/lib/editor-store/editor.types';

// ==================== Types ====================

interface ParallelScenarioManagerProps {
  onClose: () => void;
}

// ==================== Helpers ====================

function createEmptyParallelConfig(): ParallelScenarioConfig {
  return {
    id: uuidv4(),
    scenarioId: '',
    name: '',
    startOn: 'game_start',
    syncPoints: [],
    variables: {
      local: [],
      shared: [],
    },
  };
}

function createEmptySyncPoint(): SyncPoint {
  return {
    id: uuidv4(),
    type: 'wait_all',
    scenarios: [],
    onComplete: {
      action: 'continue_all',
    },
  };
}

const START_ON_OPTIONS: { value: ParallelScenarioConfig['startOn']; label: string; icon: string }[] = [
  { value: 'game_start', label: 'При старте игры', icon: '🎮' },
  { value: 'trigger', label: 'По триггеру', icon: '⚡' },
  { value: 'condition', label: 'По условию', icon: '⚖️' },
];

const SYNC_TYPE_OPTIONS: { value: SyncPoint['type']; label: string; icon: string; desc: string }[] = [
  { value: 'wait_all', label: 'Ожидать все', icon: '⏳', desc: 'Ждать завершения всех сценариев' },
  { value: 'wait_any', label: 'Ожидать любой', icon: '🔀', desc: 'Ждать завершения любого из сценариев' },
  { value: 'sequence', label: 'Последовательно', icon: '➡️', desc: 'Сценарии выполняются по порядку' },
];

const COMPLETE_ACTION_OPTIONS: { value: SyncPoint['onComplete']['action']; label: string; icon: string }[] = [
  { value: 'continue_all', label: 'Продолжить все', icon: '▶️' },
  { value: 'continue_one', label: 'Продолжить один', icon: '⏩' },
  { value: 'stop_all', label: 'Остановить все', icon: '⏹️' },
  { value: 'emit_event', label: 'Отправить событие', icon: '📡' },
];

// ==================== SyncPointEditor Component ====================

interface SyncPointEditorProps {
  point: SyncPoint;
  parallelScenarios: ParallelScenarioConfig[];
  onChange: (point: SyncPoint) => void;
  onDelete: () => void;
}

function SyncPointEditor({ point, parallelScenarios, onChange, onDelete }: SyncPointEditorProps) {
  return (
    <div className="p-3 rounded-lg bg-background-modifier-hover/30 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          {SYNC_TYPE_OPTIONS.find((o) => o.value === point.type)?.icon} Точка синхронизации
        </span>
        <button
          onClick={onDelete}
          className="text-text-secondary hover:text-error transition-colors text-sm p-1"
          title="Удалить точку синхронизации"
        >
          ✕
        </button>
      </div>

      {/* Тип синхронизации */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">Тип синхронизации</label>
        <select
          value={point.type}
          onChange={(e) => onChange({ ...point, type: e.target.value as SyncPoint['type'] })}
          className="input-field text-xs"
        >
          {SYNC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label} — {opt.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор сценариев */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">Сценарии</label>
        <div className="flex flex-wrap gap-1.5">
          {parallelScenarios.map((sc) => (
            <label
              key={sc.id}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                point.scenarios.includes(sc.id)
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-background-modifier-hover/30 text-text-secondary border border-border hover:bg-background-modifier-hover/50'
              }`}
            >
              <input
                type="checkbox"
                checked={point.scenarios.includes(sc.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange({ ...point, scenarios: [...point.scenarios, sc.id] });
                  } else {
                    onChange({ ...point, scenarios: point.scenarios.filter((s) => s !== sc.id) });
                  }
                }}
                className="sr-only"
              />
              {sc.name || <span className="italic">Без названия</span>}
            </label>
          ))}
          {parallelScenarios.length === 0 && (
            <span className="text-[10px] text-text-secondary italic">
              Нет параллельных сценариев
            </span>
          )}
        </div>
      </div>

      {/* Действие при завершении */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">При завершении</label>
        <select
          value={point.onComplete.action}
          onChange={(e) =>
            onChange({
              ...point,
              onComplete: {
                ...point.onComplete,
                action: e.target.value as SyncPoint['onComplete']['action'],
              },
            })
          }
          className="input-field text-xs"
        >
          {COMPLETE_ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Данные события (если emit_event) */}
      {point.onComplete.action === 'emit_event' && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium">Данные события (JSON)</label>
          <textarea
            value={point.onComplete.eventData ? JSON.stringify(point.onComplete.eventData, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ ...point, onComplete: { ...point.onComplete, eventData: parsed } });
              } catch {
                // Невалидный JSON — игнорируем
              }
            }}
            className="input-field text-xs font-mono"
            rows={3}
            placeholder='{"key": "value"}'
          />
        </div>
      )}
    </div>
  );
}

// ==================== ParallelScenarioForm Component ====================

interface ParallelScenarioFormProps {
  config: ParallelScenarioConfig;
  onChange: (config: ParallelScenarioConfig) => void;
  onClose: () => void;
}

function ParallelScenarioForm({ config, onChange, onClose }: ParallelScenarioFormProps) {
  const storeScenarios = useEditorStore((s) => s.scenes);

  const handleAddSyncPoint = useCallback(() => {
    onChange({
      ...config,
      syncPoints: [...config.syncPoints, createEmptySyncPoint()],
    });
  }, [config, onChange]);

  const handleUpdateSyncPoint = useCallback(
    (index: number, point: SyncPoint) => {
      const newPoints = [...config.syncPoints];
      newPoints[index] = point;
      onChange({ ...config, syncPoints: newPoints });
    },
    [config, onChange]
  );

  const handleRemoveSyncPoint = useCallback(
    (index: number) => {
      onChange({
        ...config,
        syncPoints: config.syncPoints.filter((_, i) => i !== index),
      });
    },
    [config, onChange]
  );

  const handleAddLocalVar = useCallback(() => {
    onChange({
      ...config,
      variables: {
        ...config.variables,
        local: [...config.variables.local, ''],
      },
    });
  }, [config, onChange]);

  const handleUpdateLocalVar = useCallback(
    (index: number, value: string) => {
      const newLocal = [...config.variables.local];
      newLocal[index] = value;
      onChange({
        ...config,
        variables: { ...config.variables, local: newLocal },
      });
    },
    [config, onChange]
  );

  const handleRemoveLocalVar = useCallback(
    (index: number) => {
      onChange({
        ...config,
        variables: {
          ...config.variables,
          local: config.variables.local.filter((_, i) => i !== index),
        },
      });
    },
    [config, onChange]
  );

  const handleAddSharedVar = useCallback(() => {
    onChange({
      ...config,
      variables: {
        ...config.variables,
        shared: [...config.variables.shared, ''],
      },
    });
  }, [config, onChange]);

  const handleUpdateSharedVar = useCallback(
    (index: number, value: string) => {
      const newShared = [...config.variables.shared];
      newShared[index] = value;
      onChange({
        ...config,
        variables: { ...config.variables, shared: newShared },
      });
    },
    [config, onChange]
  );

  const handleRemoveSharedVar = useCallback(
    (index: number) => {
      onChange({
        ...config,
        variables: {
          ...config.variables,
          shared: config.variables.shared.filter((_, i) => i !== index),
        },
      });
    },
    [config, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Название и ID сценария */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">Название</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            className="input-field text-sm"
            placeholder="Название параллельного сценария"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">ID сценария</label>
          <input
            type="text"
            value={config.scenarioId}
            onChange={(e) => onChange({ ...config, scenarioId: e.target.value })}
            className="input-field text-sm"
            placeholder="scenario-123"
          />
        </div>
      </div>

      {/* Условие запуска */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">Запуск</label>
        <select
          value={config.startOn}
          onChange={(e) =>
            onChange({ ...config, startOn: e.target.value as ParallelScenarioConfig['startOn'] })
          }
          className="input-field text-sm"
        >
          {START_ON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Триггер-событие (если startOn === 'trigger') */}
      {config.startOn === 'trigger' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">Событие-триггер</label>
          <input
            type="text"
            value={config.triggerEvent || ''}
            onChange={(e) => onChange({ ...config, triggerEvent: e.target.value })}
            className="input-field text-sm"
            placeholder="onSceneEnter"
          />
        </div>
      )}

      {/* Переменные */}
      <div className="grid grid-cols-2 gap-3">
        {/* Локальные переменные */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Локальные переменные</label>
            <button
              onClick={handleAddLocalVar}
              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              + Добавить
            </button>
          </div>
          {config.variables.local.length === 0 ? (
            <div className="text-[10px] text-text-secondary italic py-2 text-center bg-background-modifier-hover/20 rounded border border-dashed border-border">
              Нет локальных переменных
            </div>
          ) : (
            <div className="space-y-1">
              {config.variables.local.map((v, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => handleUpdateLocalVar(i, e.target.value)}
                    className="input-field text-xs flex-1"
                    placeholder="имя_переменной"
                  />
                  <button
                    onClick={() => handleRemoveLocalVar(i)}
                    className="text-text-secondary hover:text-error text-xs p-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Общие переменные */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Общие переменные</label>
            <button
              onClick={handleAddSharedVar}
              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              + Добавить
            </button>
          </div>
          {config.variables.shared.length === 0 ? (
            <div className="text-[10px] text-text-secondary italic py-2 text-center bg-background-modifier-hover/20 rounded border border-dashed border-border">
              Нет общих переменных
            </div>
          ) : (
            <div className="space-y-1">
              {config.variables.shared.map((v, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={v}
                    onChange={(e) => handleUpdateSharedVar(i, e.target.value)}
                    className="input-field text-xs flex-1"
                    placeholder="имя_переменной"
                  />
                  <button
                    onClick={() => handleRemoveSharedVar(i)}
                    className="text-text-secondary hover:text-error text-xs p-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Точки синхронизации */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text-secondary">
            Точки синхронизации ({config.syncPoints.length})
          </label>
          <button
            onClick={handleAddSyncPoint}
            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            + Добавить точку
          </button>
        </div>
        {config.syncPoints.length === 0 ? (
          <div className="text-xs text-text-secondary text-center py-4 bg-background-modifier-hover/20 rounded-lg border border-dashed border-border">
            Нет точек синхронизации
          </div>
        ) : (
          <div className="space-y-2">
            {config.syncPoints.map((point, index) => (
              <SyncPointEditor
                key={point.id}
                point={point}
                parallelScenarios={useEditorStore.getState().parallelScenarios}
                onChange={(p) => handleUpdateSyncPoint(index, p)}
                onDelete={() => handleRemoveSyncPoint(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Main Component ====================

export default function ParallelScenarioManager({ onClose }: ParallelScenarioManagerProps) {
  const parallelScenarios = useEditorStore((s) => s.parallelScenarios);
  const syncPoints = useEditorStore((s) => s.syncPoints);
  const addParallelScenario = useEditorStore((s) => s.addParallelScenario);
  const updateParallelScenario = useEditorStore((s) => s.updateParallelScenario);
  const removeParallelScenario = useEditorStore((s) => s.removeParallelScenario);
  const addSyncPoint = useEditorStore((s) => s.addSyncPoint);
  const updateSyncPoint = useEditorStore((s) => s.updateSyncPoint);
  const removeSyncPoint = useEditorStore((s) => s.removeSyncPoint);

  const [editingConfig, setEditingConfig] = useState<ParallelScenarioConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'sync'>('scenarios');

  const handleCreate = useCallback(() => {
    setEditingConfig(createEmptyParallelConfig());
    setIsCreating(true);
  }, []);

  const handleEdit = useCallback((config: ParallelScenarioConfig) => {
    setEditingConfig(JSON.parse(JSON.stringify(config)));
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingConfig) return;
    if (isCreating) {
      addParallelScenario(editingConfig);
    } else {
      updateParallelScenario(editingConfig.id, editingConfig);
    }
    setEditingConfig(null);
  }, [editingConfig, isCreating, addParallelScenario, updateParallelScenario]);

  const handleDelete = useCallback(
    (id: string) => {
      removeParallelScenario(id);
      setShowDeleteConfirm(null);
    },
    [removeParallelScenario]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl mx-4 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📑</span>
            <h2 className="text-base font-semibold text-text-primary">
              Параллельные сценарии
            </h2>
            <span className="text-xs text-text-secondary bg-background-modifier-hover/50 px-2 py-0.5 rounded-full">
              {parallelScenarios.length} сценариев
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4 shrink-0">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'scenarios'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            📋 Сценарии
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'sync'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            🔗 Синхронизация ({syncPoints.length})
          </button>
        </div>

        {editingConfig ? (
          /* ===== Редактор параллельного сценария ===== */
          <div className="flex-1 overflow-y-auto p-4">
            <ParallelScenarioForm
              config={editingConfig}
              onChange={setEditingConfig}
              onClose={() => setEditingConfig(null)}
            />
          </div>
        ) : activeTab === 'scenarios' ? (
          /* ===== Список параллельных сценариев ===== */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <span className="text-xs text-text-secondary">
                Параллельные сценарии запускаются одновременно с основным
              </span>
              <button
                onClick={handleCreate}
                className="btn-primary text-xs px-3 py-1.5"
              >
                ➕ Добавить параллельный сценарий
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {parallelScenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">📑</span>
                  <p className="text-sm font-medium text-text-primary mb-1">Нет параллельных сценариев</p>
                  <p className="text-xs text-text-secondary mb-4 max-w-md">
                    Параллельные сценарии позволяют запускать несколько сценариев одновременно.
                    Полезно для сложных игр с разными ролями или параллельными квестами.
                  </p>
                  <button
                    onClick={handleCreate}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    ➕ Создать параллельный сценарий
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {parallelScenarios.map((config) => (
                    <div
                      key={config.id}
                      className="p-3 rounded-lg bg-background-modifier-hover/20 border border-border hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {config.name || <span className="italic text-text-secondary">Без названия</span>}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background-modifier-hover/50 text-text-secondary">
                              {START_ON_OPTIONS.find((o) => o.value === config.startOn)?.icon}{' '}
                              {START_ON_OPTIONS.find((o) => o.value === config.startOn)?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-text-secondary">
                              ID: {config.scenarioId || '—'}
                            </span>
                            <span className="text-[10px] text-text-secondary">
                              📍 {config.syncPoints.length} точек синхр.
                            </span>
                            <span className="text-[10px] text-text-secondary">
                              🔒 {config.variables.local.length} локальных
                            </span>
                            <span className="text-[10px] text-text-secondary">
                              🌐 {config.variables.shared.length} общих
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-background-modifier-hover text-xs"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(config.id)}
                            className="text-text-secondary hover:text-error p-1 rounded hover:bg-error/10 text-xs"
                            title="Удалить"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== Точки синхронизации ===== */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <span className="text-xs text-text-secondary">
                Точки синхронизации координируют выполнение параллельных сценариев
              </span>
              <button
                onClick={() => {
                  const newPoint = createEmptySyncPoint();
                  addSyncPoint(newPoint);
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                ➕ Добавить точку синхронизации
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {syncPoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">🔗</span>
                  <p className="text-sm font-medium text-text-primary mb-1">Нет точек синхронизации</p>
                  <p className="text-xs text-text-secondary mb-4">
                    Точки синхронизации позволяют координировать параллельные сценарии
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncPoints.map((point) => (
                    <div
                      key={point.id}
                      className="p-3 rounded-lg bg-background-modifier-hover/20 border border-border group"
                    >
                      <SyncPointEditor
                        point={point}
                        parallelScenarios={parallelScenarios}
                        onChange={(p) => updateSyncPoint(point.id, p)}
                        onDelete={() => removeSyncPoint(point.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
          {editingConfig ? (
            <>
              <button
                onClick={() => setEditingConfig(null)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
              >
                ← Назад к списку
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingConfig(null)}
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
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Удалить параллельный сценарий?
              </h3>
              <p className="text-sm text-text-secondary">
                Это действие нельзя отменить. Связанные точки синхронизации будут обновлены.
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