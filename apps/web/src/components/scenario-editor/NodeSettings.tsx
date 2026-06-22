import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { ScenarioNodeData, NodeType } from '@/types/scenario';

interface NodeSettingsProps {
  node: Node<ScenarioNodeData> | null;
  onUpdate: (nodeId: string, data: ScenarioNodeData) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodeSettings({ node, onUpdate, onDelete, onClose }: NodeSettingsProps) {
  const [data, setData] = useState<ScenarioNodeData>({
    label: '',
    question: '',
    answer: '',
    hint: '',
    points: 10,
    penalty: 0,
  });

  useEffect(() => {
    if (node?.data) {
      setData(node.data);
    }
  }, [node]);

  if (!node) return null;

  const handleChange = (field: keyof ScenarioNodeData, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(node.id, newData);
  };

  const nodeTypeLabels: Record<NodeType, string> = {
    START: '🚀 Старт',
    FINISH: '🏁 Финиш',
    TEXT: '📝 Текст',
    CODE: '🔢 Код',
    PHOTO: '📷 Фото',
    GPS: '📍 GPS',
    QR: '📱 QR',
    CHOICE: '🎯 Выбор',
    TIMER: '⏱ Таймер',
    BRANCH: '🔀 Ветвление',
    NPC: '🗣 NPC',
  };

  return (
    <div className="w-80 bg-background border-l border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">
          Настройки: {nodeTypeLabels[node.type as NodeType]}
        </h2>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="label text-sm">Заголовок</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="input-field text-sm"
            placeholder="Название блока"
          />
        </div>

        {/* Question (for most node types) */}
        {node.type !== 'START' && node.type !== 'FINISH' && (
          <>
            <div>
              <label className="label text-sm">Текст задания</label>
              <textarea
                value={data.question || ''}
                onChange={(e) => handleChange('question', e.target.value)}
                className="input-field text-sm min-h-[80px]"
                placeholder="Опишите задание для участников..."
                rows={3}
              />
            </div>

            {/* Answer (for TEXT, CODE) */}
            {(node.type === 'TEXT' || node.type === 'CODE') && (
              <div>
                <label className="label text-sm">Правильный ответ</label>
                <input
                  type="text"
                  value={data.answer || ''}
                  onChange={(e) => handleChange('answer', e.target.value)}
                  className="input-field text-sm"
                  placeholder="Введите правильный ответ"
                />
              </div>
            )}

            {/* Hint */}
            <div>
              <label className="label text-sm">Подсказка</label>
              <textarea
                value={data.hint || ''}
                onChange={(e) => handleChange('hint', e.target.value)}
                className="input-field text-sm"
                placeholder="Подсказка для игроков"
                rows={2}
              />
            </div>

            {/* Points */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-sm">Очки</label>
                <input
                  type="number"
                  value={data.points || 10}
                  onChange={(e) => handleChange('points', parseInt(e.target.value))}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="label text-sm">Штраф</label>
                <input
                  type="number"
                  value={data.penalty || 0}
                  onChange={(e) => handleChange('penalty', parseInt(e.target.value))}
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Duration for TIMER */}
            {node.type === 'TIMER' && (
              <div>
                <label className="label text-sm">Длительность (сек)</label>
                <input
                  type="number"
                  value={data.duration || 60}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="input-field text-sm"
                />
              </div>
            )}

            {/* Options for CHOICE */}
            {node.type === 'CHOICE' && (
              <div>
                <label className="label text-sm">Варианты ответов</label>
                <div className="space-y-2">
                  {(data.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(data.options || [])];
                          newOptions[index] = e.target.value;
                          handleChange('options', newOptions);
                        }}
                        className="input-field text-sm flex-1"
                        placeholder={`Вариант ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = (data.options || []).filter((_, i) => i !== index);
                          handleChange('options', newOptions);
                        }}
                        className="text-error hover:text-error/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleChange('options', [...(data.options || []), ''])}
                    className="btn-secondary text-sm w-full"
                  >
                    + Добавить вариант
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete button */}
        {node.type !== 'START' && node.type !== 'FINISH' && (
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
