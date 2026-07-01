'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import {
  CrossScenarioEvent,
  CrossScenarioCommunication,
} from '@/lib/editor-store/editor.types';

// ==================== Types ====================

interface CrossScenarioCommPanelProps {
  onClose: () => void;
}

type TabType = 'variables' | 'events';

const VARIABLE_TYPES: { value: CrossScenarioCommunication['globalVariables'][0]['type']; label: string }[] = [
  { value: 'string', label: 'Строка' },
  { value: 'number', label: 'Число' },
  { value: 'boolean', label: 'Булево' },
  { value: 'array', label: 'Массив' },
  { value: 'object', label: 'Объект' },
];

// ==================== Global Variable Editor ====================

interface GlobalVariableEditorProps {
  variable: CrossScenarioCommunication['globalVariables'][0];
  onChange: (data: Partial<CrossScenarioCommunication['globalVariables'][0]>) => void;
  onDelete: () => void;
}

function GlobalVariableEditor({ variable, onChange, onDelete }: GlobalVariableEditorProps) {
  const [showAccess, setShowAccess] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-background-modifier-hover/30 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          🌐 {variable.name || <span className="italic text-text-secondary">Новая переменная</span>}
        </span>
        <button
          onClick={onDelete}
          className="text-text-secondary hover:text-error transition-colors text-sm p-1"
          title="Удалить переменную"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium">Имя</label>
          <input
            type="text"
            value={variable.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input-field text-xs"
            placeholder="variable_name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium">Тип</label>
          <select
            value={variable.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
            className="input-field text-xs"
          >
            {VARIABLE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">Значение по умолчанию</label>
        <input
          type="text"
          value={String(variable.defaultValue ?? '')}
          onChange={(e) => {
            const val = e.target.value;
            const parsed = variable.type === 'number' ? Number(val) : val;
            onChange({ defaultValue: parsed });
          }}
          className="input-field text-xs"
          placeholder="default"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">Описание</label>
        <input
          type="text"
          value={variable.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="input-field text-xs"
          placeholder="Назначение переменной"
        />
      </div>

      {/* Access Settings */}
      <div>
        <button
          onClick={() => setShowAccess(!showAccess)}
          className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {showAccess ? '▼' : '▶'} Настройки доступа
        </button>

        {showAccess && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-border">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-secondary font-medium">
                Могут читать (ID сценариев, через запятую)
              </label>
              <input
                type="text"
                value={variable.readableBy.join(', ')}
                onChange={(e) =>
                  onChange({
                    readableBy: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="input-field text-xs"
                placeholder="scenario-1, scenario-2 (пусто = все)"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-secondary font-medium">
                Могут писать (ID сценариев, через запятую)
              </label>
              <input
                type="text"
                value={variable.writableBy.join(', ')}
                onChange={(e) =>
                  onChange({
                    writableBy: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="input-field text-xs"
                placeholder="scenario-1, scenario-2 (пусто = все)"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Event Editor ====================

interface EventEditorProps {
  event: CrossScenarioEvent;
  onChange: (data: Partial<CrossScenarioEvent>) => void;
  onDelete: () => void;
}

function EventEditor({ event, onChange, onDelete }: EventEditorProps) {
  const [payloadKeys, setPayloadKeys] = useState<string[]>(
    Object.keys(event.payloadSchema)
  );

  const handleAddPayloadField = useCallback(() => {
    const newKey = `field_${payloadKeys.length}`;
    setPayloadKeys([...payloadKeys, newKey]);
    onChange({
      payloadSchema: { ...event.payloadSchema, [newKey]: 'string' },
    });
  }, [payloadKeys, event.payloadSchema, onChange]);

  const handleRemovePayloadField = useCallback(
    (key: string) => {
      const newSchema = { ...event.payloadSchema };
      delete newSchema[key];
      setPayloadKeys(payloadKeys.filter((k) => k !== key));
      onChange({ payloadSchema: newSchema });
    },
    [payloadKeys, event.payloadSchema, onChange]
  );

  const handlePayloadKeyChange = useCallback(
    (oldKey: string, newKey: string) => {
      const newSchema: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.payloadSchema)) {
        newSchema[k === oldKey ? newKey : k] = v;
      }
      setPayloadKeys(payloadKeys.map((k) => (k === oldKey ? newKey : k)));
      onChange({ payloadSchema: newSchema });
    },
    [payloadKeys, event.payloadSchema, onChange]
  );

  const handlePayloadTypeChange = useCallback(
    (key: string, type: string) => {
      onChange({
        payloadSchema: { ...event.payloadSchema, [key]: type },
      });
    },
    [event.payloadSchema, onChange]
  );

  return (
    <div className="p-3 rounded-lg bg-background-modifier-hover/30 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          📡 {event.name || <span className="italic text-text-secondary">Новое событие</span>}
        </span>
        <button
          onClick={onDelete}
          className="text-text-secondary hover:text-error transition-colors text-sm p-1"
          title="Удалить событие"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium">Название</label>
          <input
            type="text"
            value={event.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input-field text-xs"
            placeholder="event_name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium">ID</label>
          <input
            type="text"
            value={event.id}
            onChange={(e) => onChange({ id: e.target.value })}
            className="input-field text-xs"
            placeholder="event-123"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-text-secondary font-medium">Описание</label>
        <input
          type="text"
          value={event.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="input-field text-xs"
          placeholder="Описание события"
        />
      </div>

      {/* Payload Schema */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-text-secondary font-medium">
            Поля payload ({payloadKeys.length})
          </label>
          <button
            onClick={handleAddPayloadField}
            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            + Добавить поле
          </button>
        </div>

        {payloadKeys.length === 0 ? (
          <div className="text-[10px] text-text-secondary italic py-2 text-center bg-background-modifier-hover/20 rounded border border-dashed border-border">
            Нет полей payload
          </div>
        ) : (
          <div className="space-y-1">
            {payloadKeys.map((key) => (
              <div key={key} className="flex items-center gap-1">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => handlePayloadKeyChange(key, e.target.value)}
                  className="input-field text-xs flex-1"
                  placeholder="имя_поля"
                />
                <select
                  value={event.payloadSchema[key] || 'string'}
                  onChange={(e) => handlePayloadTypeChange(key, e.target.value)}
                  className="input-field text-xs w-24"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="any">any</option>
                </select>
                <button
                  onClick={() => handleRemovePayloadField(key)}
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
  );
}

// ==================== Main Component ====================

export default function CrossScenarioCommPanel({ onClose }: CrossScenarioCommPanelProps) {
  const crossScenarioComm = useEditorStore((s) => s.crossScenarioComm);
  const addGlobalVariable = useEditorStore((s) => s.addGlobalVariable);
  const updateGlobalVariable = useEditorStore((s) => s.updateGlobalVariable);
  const removeGlobalVariable = useEditorStore((s) => s.removeGlobalVariable);
  const addCrossScenarioEvent = useEditorStore((s) => s.addCrossScenarioEvent);
  const removeCrossScenarioEvent = useEditorStore((s) => s.removeCrossScenarioEvent);

  const [activeTab, setActiveTab] = useState<TabType>('variables');

  const handleAddVariable = useCallback(() => {
    addGlobalVariable({
      name: '',
      type: 'string',
      defaultValue: '',
      description: '',
      writableBy: [],
      readableBy: [],
    });
  }, [addGlobalVariable]);

  const handleAddEvent = useCallback(() => {
    addCrossScenarioEvent({
      id: uuidv4(),
      name: '',
      description: '',
      payloadSchema: {},
    });
  }, [addCrossScenarioEvent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl mx-4 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <h2 className="text-base font-semibold text-text-primary">
              Меж-сценарная коммуникация
            </h2>
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
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'variables'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            🌐 Глобальные переменные ({crossScenarioComm.globalVariables.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'events'
                ? 'text-primary border-primary'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            📡 События ({crossScenarioComm.events.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'variables' ? (
            /* ===== Global Variables Tab ===== */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Глобальные переменные доступны всем параллельным сценариям
                </span>
                <button
                  onClick={handleAddVariable}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  ➕ Добавить переменную
                </button>
              </div>

              {crossScenarioComm.globalVariables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">🌐</span>
                  <p className="text-sm font-medium text-text-primary mb-1">Нет глобальных переменных</p>
                  <p className="text-xs text-text-secondary mb-4 max-w-md">
                    Глобальные переменные позволяют обмениваться данными между параллельными сценариями.
                    Можно настроить права доступа для каждого сценария.
                  </p>
                  <button
                    onClick={handleAddVariable}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    ➕ Создать глобальную переменную
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {crossScenarioComm.globalVariables.map((gv) => (
                    <GlobalVariableEditor
                      key={gv.name || `new-${Math.random()}`}
                      variable={gv}
                      onChange={(data) => updateGlobalVariable(gv.name, data)}
                      onDelete={() => removeGlobalVariable(gv.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ===== Events Tab ===== */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Кастомные события для коммуникации между сценариями
                </span>
                <button
                  onClick={handleAddEvent}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  ➕ Добавить событие
                </button>
              </div>

              {crossScenarioComm.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl mb-3">📡</span>
                  <p className="text-sm font-medium text-text-primary mb-1">Нет событий</p>
                  <p className="text-xs text-text-secondary mb-4 max-w-md">
                    События позволяют сценариям общаться друг с другом.
                    Один сценарий отправляет событие, другой — подписывается на него.
                  </p>
                  <button
                    onClick={handleAddEvent}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    ➕ Создать событие
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {crossScenarioComm.events.map((evt) => (
                    <EventEditor
                      key={evt.id}
                      event={evt}
                      onChange={(data) => {
                        // Обновление события через store (update пока нет, используем remove+add)
                        removeCrossScenarioEvent(evt.id);
                        addCrossScenarioEvent({ ...evt, ...data });
                      }}
                      onDelete={() => removeCrossScenarioEvent(evt.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}