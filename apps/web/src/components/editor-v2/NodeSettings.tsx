'use client';

import { useState, useEffect } from 'react';
import { Scene, Mission, MissionType, BLOCK_DEFINITIONS } from '@/lib/editor-store/editor.types';

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