'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Scene } from '@/lib/editor-store/editor.types';
import { useEditorStore } from '@/lib/editor-store/editor.store';

const nodeColors: Record<string, string> = {
  location: 'bg-green-500',
  quiz: 'bg-blue-500',
  dialogue: 'bg-cyan-500',
  conference: 'bg-purple-500',
  rpg: 'bg-orange-500',
  custom: 'bg-teal-500',
};

const nodeIcons: Record<string, string> = {
  location: '📍',
  quiz: '📝',
  dialogue: '🗣',
  conference: '🎪',
  rpg: '⚔️',
  custom: '🔧',
};

const EditorNodeComponent = ({ id, data, selected }: NodeProps<Scene>) => {
  const nodeType = data.type || 'custom';
  const color = nodeColors[nodeType] || 'bg-gray-500';
  const icon = nodeIcons[nodeType] || '📄';
  const hasMissions = data.missions && data.missions.length > 0;

  // Подключение валидации для цветных рамок
  const validationErrors = useEditorStore((s) =>
    s.validationResult.errors.filter((e) => e.sceneId === id)
  );
  const hasErrors = validationErrors.some((e) => e.severity === 'error');
  const hasWarnings = !hasErrors && validationErrors.some((e) => e.severity === 'warning');

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] max-w-[300px]
        ${selected
          ? 'border-primary ring-2 ring-primary/30'
          : hasErrors
            ? 'border-error ring-2 ring-error/30'
            : hasWarnings
              ? 'border-yellow-500 ring-2 ring-yellow-500/30'
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
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        className="!bg-primary !w-2 !h-2 !border !border-white"
      />
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