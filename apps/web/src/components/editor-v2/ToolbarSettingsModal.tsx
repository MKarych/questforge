'use client';

import { ToolbarSettings, ToolbarSize, ToolbarDisplay } from '@/lib/editor-store/editor.types';

interface ToolbarSettingsModalProps {
  settings: ToolbarSettings;
  onSave: (settings: ToolbarSettings) => void;
  onClose: () => void;
}

const SIZE_OPTIONS: { value: ToolbarSize; label: string; description: string }[] = [
  { value: 'small', label: 'Маленький', description: 'Для максимального пространства' },
  { value: 'medium', label: 'Средний', description: 'По умолчанию, оптимальный' },
  { value: 'large', label: 'Большой', description: 'Для удобного нажатия' },
];

const DISPLAY_OPTIONS: { value: ToolbarDisplay; label: string; description: string }[] = [
  { value: 'icon', label: 'Только иконка', description: 'Компактно, как в Figma' },
  { value: 'icon_label', label: 'Иконка + название', description: 'Понятно, как в Notion' },
  { value: 'label', label: 'Только название', description: 'Минималистично' },
];

export default function ToolbarSettingsModal({ settings, onSave, onClose }: ToolbarSettingsModalProps) {
  const handleSizeChange = (size: ToolbarSize) => {
    onSave({ ...settings, size });
  };

  const handleDisplayChange = (display: ToolbarDisplay) => {
    onSave({ ...settings, display });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-base font-semibold text-text-primary">Настройки панели</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Размер кнопок */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Размер кнопок
            </label>
            <div className="space-y-1.5">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSizeChange(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    settings.size === opt.value
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                      : 'bg-background-modifier-hover border-border text-text-secondary hover:border-accent-primary/30 hover:text-text-primary'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs opacity-70">{opt.description}</div>
                  </div>
                  {settings.size === opt.value && (
                    <span className="text-accent-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Отображение */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Отображение кнопок
            </label>
            <div className="space-y-1.5">
              {DISPLAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDisplayChange(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    settings.display === opt.value
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                      : 'bg-background-modifier-hover border-border text-text-secondary hover:border-accent-primary/30 hover:text-text-primary'
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs opacity-70">{opt.description}</div>
                  </div>
                  {settings.display === opt.value && (
                    <span className="text-accent-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Предпросмотр */}
          <div className="bg-background-modifier-hover rounded-lg p-3 border border-border">
            <div className="text-xs text-text-secondary mb-2">Предпросмотр:</div>
            <div className="flex items-center gap-1">
              {['✅', '👁', '🎮', '✨', '🤖'].map((icon, i) => (
                <span
                  key={i}
                  className={`
                    inline-flex items-center justify-center rounded border border-border
                    ${settings.size === 'small' ? 'text-[10px] px-1 py-0.5 min-w-[22px] h-[22px]' : ''}
                    ${settings.size === 'medium' ? 'text-xs px-1.5 py-1 min-w-[28px] h-[28px]' : ''}
                    ${settings.size === 'large' ? 'text-sm px-2 py-1.5 min-w-[34px] h-[34px]' : ''}
                  `}
                >
                  {settings.display === 'label' ? ['Пров', 'Пре', 'Тес', 'AI', 'Пом'][i] : icon}
                  {settings.display === 'icon_label' && (
                    <span className="ml-1">{['Пров', 'Пре', 'Тес', 'AI', 'Пом'][i]}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}