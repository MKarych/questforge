'use client';

import { VariableDefinition } from '@/lib/editor-store/editor.types';

interface VariablesPanelProps {
  variables: VariableDefinition[];
  onAdd: () => void;
  onUpdate: (index: number, data: Partial<VariableDefinition>) => void;
  onRemove: (index: number) => void;
}

export default function VariablesPanel({
  variables,
  onAdd,
  onUpdate,
  onRemove,
}: VariablesPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Переменные сценария</h3>
        <button onClick={onAdd} className="btn-secondary text-xs">
          + Добавить
        </button>
      </div>

      {variables.length === 0 && (
        <p className="text-xs text-text-secondary text-center py-4">
          Нет переменных. Добавьте переменные для создания нелинейных сценариев.
        </p>
      )}

      <div className="space-y-2">
        {variables.map((v, index) => (
          <div
            key={index}
            className="p-2 bg-background/50 rounded border border-border space-y-1"
          >
            <div className="flex gap-1 items-start">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => onUpdate(index, { name: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Имя переменной"
                />
                <div className="flex gap-1">
                  <select
                    value={v.type}
                    onChange={(e) =>
                      onUpdate(index, { type: e.target.value as VariableDefinition['type'] })
                    }
                    className="input-field text-xs flex-1"
                  >
                    <option value="number">Число</option>
                    <option value="string">Строка</option>
                    <option value="boolean">Булево</option>
                    <option value="array">Массив</option>
                    <option value="object">Объект</option>
                  </select>
                  <select
                    value={v.scope}
                    onChange={(e) =>
                      onUpdate(index, { scope: e.target.value as VariableDefinition['scope'] })
                    }
                    className="input-field text-xs w-20"
                  >
                    <option value="local">Лок.</option>
                    <option value="global">Глоб.</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={String(v.defaultValue ?? '')}
                  onChange={(e) => {
                    let val: any = e.target.value;
                    if (v.type === 'number') val = parseFloat(val) || 0;
                    if (v.type === 'boolean') val = val === 'true';
                    onUpdate(index, { defaultValue: val });
                  }}
                  className="input-field text-xs"
                  placeholder="Значение по умолчанию"
                />
              </div>
              <button
                onClick={() => onRemove(index)}
                className="text-error hover:text-error/80 text-lg mt-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-text-secondary space-y-1">
        <p className="font-semibold mt-2">Системные переменные:</p>
        <code className="block text-[10px]">team.name, team.score, team.members</code>
        <code className="block text-[10px]">player.name, player.role</code>
        <code className="block text-[10px]">game.time, game.elapsed, game.currentNode</code>
      </div>
    </div>
  );
}