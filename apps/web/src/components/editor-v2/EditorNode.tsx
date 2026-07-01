'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Scene, LoopConfig, TRIGGER_EVENT_LABELS } from '@/lib/editor-store/editor.types';
import { useEditorStore } from '@/lib/editor-store/editor.store';

const nodeColors: Record<string, string> = {
  location: 'bg-green-500',
  quiz: 'bg-blue-500',
  dialogue: 'bg-cyan-500',
  conference: 'bg-purple-500',
  rpg: 'bg-orange-500',
  custom: 'bg-teal-500',
  loop: 'bg-cyan-500',
};

const nodeIcons: Record<string, string> = {
  location: '📍',
  quiz: '📝',
  dialogue: '🗣',
  conference: '🎪',
  rpg: '⚔️',
  custom: '🔧',
  loop: '🔄',
};

const EditorNodeComponent = ({ id, data, selected }: NodeProps<Scene>) => {
  const nodeType = data.type || 'custom';
  const color = nodeColors[nodeType] || 'bg-gray-500';
  const icon = nodeIcons[nodeType] || '📄';
  const hasMissions = data.missions && data.missions.length > 0;
  const isLoop = nodeType === 'loop';
  const loopConfig: LoopConfig | undefined = data.metadata?.loop;

  // Подключение валидации для цветных рамок
  const validationErrors = useEditorStore((s) =>
    s.validationResult.errors.filter((e) => e.sceneId === id)
  );
  const hasErrors = validationErrors.some((e) => e.severity === 'error');
  const hasWarnings = !hasErrors && validationErrors.some((e) => e.severity === 'warning');

  // Триггеры, связанные с этой сценой
  const sceneTriggers = useEditorStore((s) =>
    s.triggers.filter((t) => {
      if (!t.enabled) return false;
      if (!t.eventFilter?.sceneId) return false;
      return t.eventFilter.sceneId === id;
    })
  );
  const hasTriggers = sceneTriggers.length > 0;

  const getLoopLabel = (config: LoopConfig): string => {
    switch (config.type) {
      case 'for':
        return `🔄 for: ${config.count || '?'} раз(а)`;
      case 'while':
        return `🔄 while: пока условие истинно`;
      case 'forEach':
        return `🔄 forEach: по ${config.collectionVariable || 'массиву'}`;
      default:
        return '🔄 Цикл';
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md min-w-[200px] max-w-[300px]
        ${isLoop ? 'border-2 border-dashed' : 'border-2'}
        ${selected
          ? 'border-primary ring-2 ring-primary/30'
          : hasErrors
            ? 'border-error ring-2 ring-error/30'
            : hasWarnings
              ? 'border-yellow-500 ring-2 ring-yellow-500/30'
              : isLoop
                ? 'border-cyan-500'
                : 'border-border'
        }
        bg-background hover:shadow-lg
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${color} text-white`}>
          {icon}
        </div>
        <span className="font-semibold text-text-primary text-sm">{data.title || 'Сцена'}</span>
        {hasTriggers && (
          <span
            className="ml-auto text-yellow-500 text-xs cursor-help relative group"
            title={`${sceneTriggers.length} триггер(ов) для этой сцены`}
          >
            ⚡
            {/* Тултип со списком триггеров */}
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
              <div className="bg-background border border-border rounded-lg shadow-xl p-2 min-w-[180px]">
                <p className="text-[10px] font-semibold text-text-secondary mb-1">Триггеры сцены:</p>
                {sceneTriggers.map((t) => (
                  <p key={t.id} className="text-[10px] text-text-primary truncate">
                    {t.name || TRIGGER_EVENT_LABELS[t.event]}
                  </p>
                ))}
              </div>
            </div>
          </span>
        )}
        {hasErrors && (
          <span className="ml-auto text-error text-xs" title="Ошибка валидации">⚠️</span>
        )}
        {hasWarnings && !hasErrors && (
          <span className="ml-auto text-yellow-500 text-xs" title="Предупреждение">⚠️</span>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-2">
          {data.description}
        </p>
      )}

      {/* Loop info */}
      {isLoop && loopConfig && (
        <div className="mb-2 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
          <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
            {getLoopLabel(loopConfig)}
          </p>
          {loopConfig.counterVariable && (
            <p className="text-[10px] text-text-secondary mt-0.5">
              Счётчик: {loopConfig.counterVariable}
            </p>
          )}
          {loopConfig.itemVariable && (
            <p className="text-[10px] text-text-secondary mt-0.5">
              Элемент: {loopConfig.itemVariable}
            </p>
          )}
          {loopConfig.maxIterations && (
            <p className="text-[10px] text-text-secondary mt-0.5">
              Max: {loopConfig.maxIterations} итераций
            </p>
          )}
        </div>
      )}

      {/* Missions count */}
      {hasMissions && (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.missions.map((m) => (
            <span
              key={m.id}
              className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              title={m.title}
            >
              {getMissionIcon(m.type)} {m.title || m.type}
            </span>
          ))}
        </div>
      )}

      {/* GPS indicator */}
      {data.metadata?.gps && (
        <div className="text-[10px] text-yellow-500 flex items-center gap-1">
          📍 GPS: {data.metadata.gps.lat.toFixed(4)}, {data.metadata.gps.lng.toFixed(4)}
        </div>
      )}

      {/* Timer indicator */}
      {data.metadata?.timer && (
        <div className="text-[10px] text-red-400 flex items-center gap-1">
          ⏱ {data.metadata.timer}с
        </div>
      )}

      {/* Handle для соединений */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        className="!bg-primary !w-2 !h-2 !border !border-white"
      />

      {/* Loop handles: два выхода — тело цикла (слева) и выход (справа) */}
      {isLoop ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`${id}-loop-body`}
            className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-white !-ml-6"
            title="Тело цикла (повторять)"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id={`${id}-loop-exit`}
            className="!bg-green-500 !w-3 !h-3 !border-2 !border-white !ml-6"
            title="Выход из цикла"
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[8px] text-cyan-500 font-medium">⟳ тело</span>
            <span className="text-[8px] text-green-500 font-medium">→ выход</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id={`${id}-source`}
          className="!bg-primary !w-2 !h-2 !border !border-white"
        />
      )}
    </div>
  );
};

function getMissionIcon(type: string): string {
  const icons: Record<string, string> = {
    text: '📝',
    code: '🔢',
    photo: '📷',
    gps: '📍',
    qr: '📱',
    choice: '🎯',
    collect: '🎒',
    dialogue: '💬',
  };
  return icons[type] || '📋';
}

export default memo(EditorNodeComponent);