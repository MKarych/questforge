'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Scene,
  Mission,
  MissionType,
  Condition,
  ConditionGroup,
  SingleCondition,
  LoopConfig,
  LoopType,
  BLOCK_DEFINITIONS,
} from '@/lib/editor-store/editor.types';
import { useEditorStore } from '@/lib/editor-store/editor.store';
import ConditionBuilder from './ConditionBuilder';

interface NodeSettingsProps {
  node: Scene | null;
  onUpdate: (sceneId: string, data: Partial<Scene>) => void;
  onDelete: (sceneId: string) => void;
  onAddMission: (sceneId: string, type: MissionType) => void;
  onUpdateMission: (sceneId: string, missionId: string, data: Partial<Mission>) => void;
  onRemoveMission: (sceneId: string, missionId: string) => void;
  onClose: () => void;
  onOpenAssetPicker?: () => void;
}

const missionTypeOptions: { value: MissionType; label: string }[] = [
  { value: 'text', label: '📝 Текст' },
  { value: 'code', label: '🔢 Код' },
  { value: 'photo', label: '📷 Фото' },
  { value: 'gps', label: '📍 GPS' },
  { value: 'qr', label: '📱 QR' },
  { value: 'choice', label: '🎯 Выбор' },
  { value: 'collect', label: '🎒 Сбор' },
  { value: 'dialogue', label: '💬 Диалог' },
  // Медиа
  { value: 'audio', label: '🎵 Аудио' },
  { value: 'video', label: '🎬 Видео' },
  { value: 'image', label: '🖼 Изображение' },
  // Инвентарь
  { value: 'inventory_get', label: '🎒 Получить предмет' },
  { value: 'inventory_spend', label: '📦 Потратить предмет' },
  { value: 'inventory_check', label: '🔍 Проверка предмета' },
  // Достижения
  { value: 'achievement', label: '🏆 Достижение' },
];

export default function NodeSettings({
  node,
  onUpdate,
  onDelete,
  onAddMission,
  onUpdateMission,
  onRemoveMission,
  onClose,
  onOpenAssetPicker,
}: NodeSettingsProps) {
  const [localData, setLocalData] = useState<Partial<Scene>>({});

  useEffect(() => {
    if (node) {
      setLocalData({
        title: node.title,
        description: node.description,
        metadata: { ...node.metadata },
      });
    }
  }, [node]);

  if (!node) return null;

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(node.id, { [field]: value });
  };

  const handleMetadataChange = (field: string, value: any) => {
    const metadata = { ...(localData.metadata || {}), [field]: value };
    setLocalData({ ...localData, metadata });
    onUpdate(node.id, { metadata });
  };

  const blockDef = BLOCK_DEFINITIONS.find(
    (b) => b.type === node.type && b.label === node.title
  );

  return (
    <div className="w-80 bg-background border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text-primary truncate">
            {blockDef?.icon || '📄'} {node.title}
          </h2>
          <p className="text-xs text-text-secondary font-mono truncate">
            ID: {node.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl ml-2 shrink-0"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="label text-sm">Заголовок</label>
          <input
            type="text"
            value={localData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="input-field text-sm"
            placeholder="Название узла"
          />
        </div>

        {/* Description */}
        <div>
          <label className="label text-sm">Описание</label>
          <textarea
            value={localData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input-field text-sm min-h-[60px]"
            placeholder="Описание узла..."
            rows={2}
          />
        </div>

        {/* GPS */}
        <div>
          <label className="label text-sm">📍 GPS-координаты</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={node.metadata?.gps?.lat || ''}
              onChange={(e) =>
                handleMetadataChange('gps', {
                  lat: parseFloat(e.target.value) || 0,
                  lng: node.metadata?.gps?.lng || 0,
                  radius: node.metadata?.gps?.radius || 50,
                })
              }
              className="input-field text-sm"
              placeholder="Широта"
              step="0.000001"
            />
            <input
              type="number"
              value={node.metadata?.gps?.lng || ''}
              onChange={(e) =>
                handleMetadataChange('gps', {
                  lat: node.metadata?.gps?.lat || 0,
                  lng: parseFloat(e.target.value) || 0,
                  radius: node.metadata?.gps?.radius || 50,
                })
              }
              className="input-field text-sm"
              placeholder="Долгота"
              step="0.000001"
            />
          </div>
          <input
            type="number"
            value={node.metadata?.gps?.radius || 50}
            onChange={(e) =>
              handleMetadataChange('gps', {
                lat: node.metadata?.gps?.lat || 0,
                lng: node.metadata?.gps?.lng || 0,
                radius: parseInt(e.target.value) || 50,
              })
            }
            className="input-field text-sm mt-2"
            placeholder="Радиус (м)"
            min={1}
          />
        </div>

        {/* Timer */}
        <div>
          <label className="label text-sm">⏱ Таймер (секунды)</label>
          <input
            type="number"
            value={node.metadata?.timer || ''}
            onChange={(e) => handleMetadataChange('timer', parseInt(e.target.value) || 0)}
            className="input-field text-sm"
            placeholder="0 = без таймера"
            min={0}
          />
        </div>

        {/* Required Role */}
        <RoleSelectField
          label="👤 Требуемая роль"
          value={node.metadata?.requiredRole || ''}
          onChange={(val) => handleMetadataChange('requiredRole', val || undefined)}
          placeholder="Нет ограничения по роли"
        />

        {/* Missions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label text-sm">🎯 Задания</label>
            <select
              className="input-field text-xs w-auto"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAddMission(node.id, e.target.value as MissionType);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>+ Добавить</option>
              {missionTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {node.missions.map((mission) => (
              <div
                key={mission.id}
                className="p-2 bg-background/50 rounded border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary">
                    {missionTypeOptions.find((o) => o.value === mission.type)?.label || mission.type}
                  </span>
                  <button
                    onClick={() => onRemoveMission(node.id, mission.id)}
                    className="text-error hover:text-error/80 text-sm"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={mission.title}
                  onChange={(e) =>
                    onUpdateMission(node.id, mission.id, { title: e.target.value })
                  }
                  className="input-field text-xs"
                  placeholder="Название задания"
                />
                <textarea
                  value={mission.description}
                  onChange={(e) =>
                    onUpdateMission(node.id, mission.id, { description: e.target.value })
                  }
                  className="input-field text-xs min-h-[40px]"
                  placeholder="Описание задания"
                  rows={1}
                />
                {/* Mission-specific config fields */}
                {renderMissionConfig(node.id, mission, onUpdateMission, onOpenAssetPicker)}
              </div>
            ))}
            {node.missions.length === 0 && (
              <p className="text-xs text-text-secondary text-center py-2">
                Нет заданий. Добавьте через выпадающий список.
              </p>
            )}
          </div>
        </div>

        {/* Conditions Section — для блоков "Ветвление" и "Условие" */}
        {(node.title === 'Ветвление' || node.title === 'Условие') && (
          <div className="pt-2 border-t border-border">
            <ConditionSection
              nodeId={node.id}
              conditions={node.metadata?.conditions || null}
              onUpdate={(conditions) => handleMetadataChange('conditions', conditions)}
            />
          </div>
        )}

        {/* Loop Settings — для блоков "Цикл" */}
        {node.type === 'loop' && (
          <div className="pt-2 border-t border-border">
            <LoopSettingsSection
              loopConfig={node.metadata?.loop || null}
              onUpdate={(loop) => handleMetadataChange('loop', loop)}
            />
          </div>
        )}

        {/* Delete */}
        {node.title !== 'Старт' && node.title !== 'Финиш' && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => onDelete(node.id)}
              className="btn-error w-full"
            >
              🗑 Удалить блок
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function renderMissionConfig(
  nodeId: string,
  mission: Mission,
  onUpdateMission: (nodeId: string, missionId: string, data: Partial<Mission>) => void,
  onOpenAssetPicker?: () => void
) {
  const update = (data: Partial<Mission>) => onUpdateMission(nodeId, mission.id, data);
  const cfg = mission.config as any;

  // Общие поля: очки, штраф, подсказки
  const commonFields = (
    <>
      <div className="grid grid-cols-2 gap-1">
        <input
          type="number"
          value={(cfg as any)?.points ?? 0}
          onChange={(e) =>
            update({ config: { ...cfg, points: parseInt(e.target.value) || 0 } })
          }
          className="input-field text-xs"
          placeholder="Очки"
          min={0}
        />
        <input
          type="number"
          value={(cfg as any)?.penalty ?? 0}
          onChange={(e) =>
            update({ config: { ...cfg, penalty: parseInt(e.target.value) || 0 } })
          }
          className="input-field text-xs"
          placeholder="Штраф"
          min={0}
        />
      </div>
      {mission.hints.length > 0 ? (
        mission.hints.map((hint, idx) => (
          <input
            key={hint.id}
            type="text"
            value={hint.text}
            onChange={(e) => {
              const newHints = [...mission.hints];
              newHints[idx] = { ...hint, text: e.target.value };
              update({ hints: newHints });
            }}
            className="input-field text-xs"
            placeholder={`Подсказка ${idx + 1}`}
          />
        ))
      ) : (
        <button
          onClick={() =>
            update({
              hints: [{ id: crypto.randomUUID?.() || Math.random().toString(36), text: '', order: 0 }],
            })
          }
          className="btn-secondary text-xs w-full"
        >
          💡 Добавить подсказку
        </button>
      )}
    </>
  );

  switch (mission.type) {
    case 'text':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.correctAnswer || ''}
            onChange={(e) => update({ config: { ...cfg, correctAnswer: e.target.value } })}
            className="input-field text-xs"
            placeholder="Правильный ответ"
          />
          <select
            value={cfg?.matchMode || 'exact'}
            onChange={(e) => update({ config: { ...cfg, matchMode: e.target.value } })}
            className="input-field text-xs"
          >
            <option value="exact">Точное совпадение</option>
            <option value="case_insensitive">Без учёта регистра</option>
            <option value="regex">Regex</option>
          </select>
          {commonFields}
        </div>
      );
    case 'code':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.correctCode || ''}
            onChange={(e) => update({ config: { ...cfg, correctCode: e.target.value } })}
            className="input-field text-xs"
            placeholder="Правильный код"
          />
          {commonFields}
        </div>
      );
    case 'choice':
      return (
        <div className="space-y-1">
          {(cfg?.options || ['', '']).map((opt: string, idx: number) => (
            <div key={idx} className="flex gap-1 items-center">
              <input
                type="radio"
                name={`correct-${mission.id}`}
                checked={cfg?.correctIndex === idx}
                onChange={() => update({ config: { ...cfg, correctIndex: idx } })}
                className="accent-primary"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(cfg?.options || [])];
                  newOptions[idx] = e.target.value;
                  update({ config: { ...cfg, options: newOptions } });
                }}
                className="input-field text-xs flex-1"
                placeholder={`Вариант ${idx + 1}`}
              />
            </div>
          ))}
          <button
            onClick={() =>
              update({
                config: {
                  ...cfg,
                  options: [...(cfg?.options || []), ''],
                },
              })
            }
            className="btn-secondary text-xs w-full"
          >
            + Вариант
          </button>
          {commonFields}
        </div>
      );
    case 'gps':
      return (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <input
              type="number"
              value={cfg?.lat || ''}
              onChange={(e) => update({ config: { ...cfg, lat: parseFloat(e.target.value) || 0 } })}
              className="input-field text-xs"
              placeholder="Широта"
            />
            <input
              type="number"
              value={cfg?.lng || ''}
              onChange={(e) => update({ config: { ...cfg, lng: parseFloat(e.target.value) || 0 } })}
              className="input-field text-xs"
              placeholder="Долгота"
            />
          </div>
          <input
            type="number"
            value={cfg?.radius || 50}
            onChange={(e) => update({ config: { ...cfg, radius: parseInt(e.target.value) || 50 } })}
            className="input-field text-xs"
            placeholder="Радиус (м)"
            min={1}
          />
          {commonFields}
        </div>
      );
    case 'qr':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.data || ''}
            onChange={(e) => update({ config: { ...cfg, data: e.target.value } })}
            className="input-field text-xs"
            placeholder="Данные QR-кода"
          />
          {commonFields}
        </div>
      );
    case 'photo':
      return (
        <div className="space-y-1">
          <textarea
            value={cfg?.requirements || ''}
            onChange={(e) => update({ config: { ...cfg, requirements: e.target.value } })}
            className="input-field text-xs min-h-[40px]"
            placeholder="Требования к фото"
            rows={1}
          />
          {commonFields}
        </div>
      );
    case 'collect':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.itemId || ''}
            onChange={(e) => update({ config: { ...cfg, itemId: e.target.value } })}
            className="input-field text-xs"
            placeholder="ID предмета"
          />
          <input
            type="number"
            value={cfg?.quantity || 1}
            onChange={(e) => update({ config: { ...cfg, quantity: parseInt(e.target.value) || 1 } })}
            className="input-field text-xs"
            placeholder="Количество"
            min={1}
          />
          {commonFields}
        </div>
      );
    case 'dialogue':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.npcName || ''}
            onChange={(e) => update({ config: { ...cfg, npcName: e.target.value } })}
            className="input-field text-xs"
            placeholder="Имя NPC"
          />
          <textarea
            value={cfg?.npcDescription || ''}
            onChange={(e) => update({ config: { ...cfg, npcDescription: e.target.value } })}
            className="input-field text-xs min-h-[40px]"
            placeholder="Описание NPC"
            rows={1}
          />
          {(cfg?.dialogues || []).map((entry: any, idx: number) => (
            <div key={idx} className="p-2 bg-background/30 rounded border border-border space-y-1">
              <textarea
                value={entry.npcText || ''}
                onChange={(e) => {
                  const newDialogues = [...(cfg?.dialogues || [])];
                  newDialogues[idx] = { ...entry, npcText: e.target.value };
                  update({ config: { ...cfg, dialogues: newDialogues } });
                }}
                className="input-field text-xs min-h-[40px]"
                placeholder={`Реплика NPC ${idx + 1}`}
                rows={1}
              />
              {(entry.options || []).map((opt: any, optIdx: number) => (
                <div key={optIdx} className="flex gap-1 items-center ml-2">
                  <input
                    type="text"
                    value={opt.text || ''}
                    onChange={(e) => {
                      const newDialogues = [...(cfg?.dialogues || [])];
                      const newOptions = [...(newDialogues[idx].options || [])];
                      newOptions[optIdx] = { ...opt, text: e.target.value };
                      newDialogues[idx] = { ...newDialogues[idx], options: newOptions };
                      update({ config: { ...cfg, dialogues: newDialogues } });
                    }}
                    className="input-field text-xs flex-1"
                    placeholder={`Вариант ответа ${optIdx + 1}`}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newDialogues = [...(cfg?.dialogues || [])];
                  const newOptions = [...(entry.options || []), { text: '', targetSceneId: '' }];
                  newDialogues[idx] = { ...entry, options: newOptions };
                  update({ config: { ...cfg, dialogues: newDialogues } });
                }}
                className="btn-secondary text-xs w-full"
              >
                + Вариант ответа
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newDialogues = [...(cfg?.dialogues || []), { npcText: '', options: [] }];
              update({ config: { ...cfg, dialogues: newDialogues } });
            }}
            className="btn-secondary text-xs w-full"
          >
            + Реплика NPC
          </button>
          {commonFields}
        </div>
      );
    case 'audio':
      return (
        <div className="space-y-1">
          <div className="flex gap-1 items-center">
            <input
              type="text"
              value={cfg?.assetId || ''}
              onChange={(e) => update({ config: { ...cfg, assetId: e.target.value } })}
              className="input-field text-xs flex-1"
              placeholder="asset:// ID аудио"
            />
            {onOpenAssetPicker && (
              <button
                onClick={() => onOpenAssetPicker()}
                className="btn-secondary text-xs shrink-0"
              >
                📁
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={cfg?.autoPlay || false}
              onChange={(e) => update({ config: { ...cfg, autoPlay: e.target.checked } })}
              className="accent-primary"
            />
            Автовоспроизведение
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={cfg?.loop || false}
              onChange={(e) => update({ config: { ...cfg, loop: e.target.checked } })}
              className="accent-primary"
            />
            Зациклить
          </label>
          {commonFields}
        </div>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <div className="flex gap-1 items-center">
            <input
              type="text"
              value={cfg?.assetId || ''}
              onChange={(e) => update({ config: { ...cfg, assetId: e.target.value } })}
              className="input-field text-xs flex-1"
              placeholder="asset:// ID видео"
            />
            {onOpenAssetPicker && (
              <button
                onClick={() => onOpenAssetPicker()}
                className="btn-secondary text-xs shrink-0"
              >
                📁
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={cfg?.autoPlay || false}
              onChange={(e) => update({ config: { ...cfg, autoPlay: e.target.checked } })}
              className="accent-primary"
            />
            Автовоспроизведение
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={cfg?.loop || false}
              onChange={(e) => update({ config: { ...cfg, loop: e.target.checked } })}
              className="accent-primary"
            />
            Зациклить
          </label>
          {commonFields}
        </div>
      );
    case 'image':
      return (
        <div className="space-y-1">
          <div className="flex gap-1 items-center">
            <input
              type="text"
              value={cfg?.assetId || ''}
              onChange={(e) => update({ config: { ...cfg, assetId: e.target.value } })}
              className="input-field text-xs flex-1"
              placeholder="asset:// ID изображения"
            />
            {onOpenAssetPicker && (
              <button
                onClick={() => onOpenAssetPicker()}
                className="btn-secondary text-xs shrink-0"
              >
                📁
              </button>
            )}
          </div>
          <input
            type="text"
            value={cfg?.caption || ''}
            onChange={(e) => update({ config: { ...cfg, caption: e.target.value } })}
            className="input-field text-xs"
            placeholder="Подпись к изображению"
          />
          {commonFields}
        </div>
      );
    case 'inventory_get':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.itemId || ''}
            onChange={(e) => update({ config: { ...cfg, itemId: e.target.value } })}
            className="input-field text-xs"
            placeholder="ID предмета"
          />
          <input
            type="text"
            value={cfg?.itemName || ''}
            onChange={(e) => update({ config: { ...cfg, itemName: e.target.value } })}
            className="input-field text-xs"
            placeholder="Название предмета"
          />
          <input
            type="number"
            value={cfg?.quantity || 1}
            onChange={(e) => update({ config: { ...cfg, quantity: parseInt(e.target.value) || 1 } })}
            className="input-field text-xs"
            placeholder="Количество"
            min={1}
          />
          {commonFields}
        </div>
      );
    case 'inventory_spend':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.itemId || ''}
            onChange={(e) => update({ config: { ...cfg, itemId: e.target.value } })}
            className="input-field text-xs"
            placeholder="ID предмета"
          />
          <input
            type="text"
            value={cfg?.itemName || ''}
            onChange={(e) => update({ config: { ...cfg, itemName: e.target.value } })}
            className="input-field text-xs"
            placeholder="Название предмета"
          />
          <input
            type="number"
            value={cfg?.quantity || 1}
            onChange={(e) => update({ config: { ...cfg, quantity: parseInt(e.target.value) || 1 } })}
            className="input-field text-xs"
            placeholder="Количество"
            min={1}
          />
          {commonFields}
        </div>
      );
    case 'inventory_check':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.itemId || ''}
            onChange={(e) => update({ config: { ...cfg, itemId: e.target.value } })}
            className="input-field text-xs"
            placeholder="ID предмета"
          />
          <input
            type="text"
            value={cfg?.itemName || ''}
            onChange={(e) => update({ config: { ...cfg, itemName: e.target.value } })}
            className="input-field text-xs"
            placeholder="Название предмета"
          />
          <input
            type="number"
            value={cfg?.quantity || 1}
            onChange={(e) => update({ config: { ...cfg, quantity: parseInt(e.target.value) || 1 } })}
            className="input-field text-xs"
            placeholder="Необходимое количество"
            min={1}
          />
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={cfg?.consumeOnCheck || false}
              onChange={(e) => update({ config: { ...cfg, consumeOnCheck: e.target.checked } })}
              className="accent-primary"
            />
            Потратить при проверке
          </label>
          {commonFields}
        </div>
      );
    case 'achievement':
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={cfg?.achievementId || ''}
            onChange={(e) => update({ config: { ...cfg, achievementId: e.target.value } })}
            className="input-field text-xs"
            placeholder="ID достижения"
          />
          <input
            type="text"
            value={cfg?.achievementName || ''}
            onChange={(e) => update({ config: { ...cfg, achievementName: e.target.value } })}
            className="input-field text-xs"
            placeholder="Название достижения"
          />
          <textarea
            value={cfg?.achievementDescription || ''}
            onChange={(e) => update({ config: { ...cfg, achievementDescription: e.target.value } })}
            className="input-field text-xs min-h-[40px]"
            placeholder="Описание достижения"
            rows={1}
          />
          <input
            type="text"
            value={cfg?.icon || ''}
            onChange={(e) => update({ config: { ...cfg, icon: e.target.value } })}
            className="input-field text-xs"
            placeholder="Иконка (emoji)"
          />
          {commonFields}
        </div>
      );
    default:
      return commonFields;
  }
}

// ==================== Role Select Field ====================
function RoleSelectField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const roles = useEditorStore((s) => s.roles);

  return (
    <div>
      <label className="label text-sm">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-sm"
      >
        <option value="">{placeholder || 'Нет'}</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.icon} {role.name} ({role.team === 'red' ? '🔴' : role.team === 'blue' ? '🔵' : '⚪'})
          </option>
        ))}
      </select>
      {roles.length === 0 && (
        <p className="text-[10px] text-text-secondary mt-1">
          Роли не настроены. Добавьте их в 👤 Роли на панели инструментов.
        </p>
      )}
    </div>
  );
}

// ==================== LoopSettingsSection Component ====================
function LoopSettingsSection({
  loopConfig,
  onUpdate,
}: {
  loopConfig: LoopConfig | null;
  onUpdate: (config: LoopConfig | null) => void;
}) {
  const config = loopConfig || { type: 'for' as LoopType, maxIterations: 100 };

  const update = (partial: Partial<LoopConfig>) => {
    onUpdate({ ...config, ...partial });
  };

  return (
    <div className="space-y-3">
      <label className="label text-sm">🔄 Настройки цикла</label>

      {/* Тип цикла */}
      <div>
        <label className="text-xs text-text-secondary">Тип цикла</label>
        <select
          value={config.type}
          onChange={(e) => update({ type: e.target.value as LoopType })}
          className="input-field text-sm"
        >
          <option value="for">for — N раз</option>
          <option value="while">while — пока условие истинно</option>
          <option value="forEach">forEach — по массиву</option>
        </select>
      </div>

      {/* for: количество повторений */}
      {config.type === 'for' && (
        <>
          <div>
            <label className="text-xs text-text-secondary">Количество повторений</label>
            <input
              type="number"
              value={config.count ?? 1}
              onChange={(e) => update({ count: Math.max(1, parseInt(e.target.value) || 1) })}
              className="input-field text-sm"
              min={1}
              max={1000}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Имя переменной-счётчика</label>
            <input
              type="text"
              value={config.counterVariable || ''}
              onChange={(e) => update({ counterVariable: e.target.value || undefined })}
              className="input-field text-sm"
              placeholder="i, counter, index..."
            />
          </div>
        </>
      )}

      {/* while: условие */}
      {config.type === 'while' && (
        <div>
          <label className="text-xs text-text-secondary">Условие продолжения цикла</label>
          <div className="p-2 rounded bg-background-modifier-hover/30 border border-border">
            <ConditionBuilder
              value={(config.condition as Condition) || null}
              onChange={(condition) => update({ condition: (condition as ConditionGroup) || undefined })}
              title="Условие while"
            />
          </div>
        </div>
      )}

      {/* forEach: коллекция и элемент */}
      {config.type === 'forEach' && (
        <>
          <div>
            <label className="text-xs text-text-secondary">Переменная-массив</label>
            <input
              type="text"
              value={config.collectionVariable || ''}
              onChange={(e) => update({ collectionVariable: e.target.value || undefined })}
              className="input-field text-sm"
              placeholder="items, players, scores..."
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Переменная для текущего элемента</label>
            <input
              type="text"
              value={config.itemVariable || ''}
              onChange={(e) => update({ itemVariable: e.target.value || undefined })}
              className="input-field text-sm"
              placeholder="item, player, score..."
            />
          </div>
        </>
      )}

      {/* Общие настройки */}
      <div>
        <label className="text-xs text-text-secondary">
          Максимум итераций (защита от бесконечного цикла)
        </label>
        <input
          type="number"
          value={config.maxIterations ?? 100}
          onChange={(e) => update({ maxIterations: Math.max(1, Math.min(1000, parseInt(e.target.value) || 100)) })}
          className="input-field text-sm"
          min={1}
          max={1000}
        />
        <p className="text-[10px] text-text-secondary mt-0.5">
          По умолчанию: 100. Максимум: 1000.
        </p>
      </div>

      <div>
        <label className="text-xs text-text-secondary">Сцена после завершения цикла (ID)</label>
        <input
          type="text"
          value={config.onCompleteSceneId || ''}
          onChange={(e) => update({ onCompleteSceneId: e.target.value || undefined })}
          className="input-field text-sm"
          placeholder="scene-id"
        />
      </div>
    </div>
  );
}

// ==================== ConditionSection Component ====================
function ConditionSection({
  nodeId,
  conditions,
  onUpdate,
}: {
  nodeId: string;
  conditions: Condition | null;
  onUpdate: (conditions: Condition | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label text-sm">⚡ Условия</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
        >
          {isOpen ? 'Скрыть' : conditions ? '✏️ Редактировать' : '⚡ Добавить условие'}
        </button>
      </div>

      {conditions && !isOpen && (
        <div className="p-2 rounded bg-background-modifier-hover/30 border border-border">
          <ConditionBuilder
            value={conditions}
            onChange={onUpdate}
            mode="compact"
          />
        </div>
      )}

      {isOpen && (
        <div className="p-2 rounded-lg bg-background-modifier-hover/30 border border-border">
          <ConditionBuilder
            value={conditions}
            onChange={onUpdate}
            title="Редактор условий"
            showApply
            onApply={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}