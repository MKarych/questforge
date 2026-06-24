'use client';

import { useState } from 'react';
import { generateScenario, getAiGenerationsRemaining, getAiGenerationsLimit } from '@/lib/ai/openrouter';

interface AiEnhanceModalProps {
  scenarioJson: string;
  onApply: (data: any) => void;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { icon: '📈', text: 'Сделай задания сложнее' },
  { icon: '💡', text: 'Добавь подсказки' },
  { icon: '🧘', text: 'Упрости логику' },
  { icon: '👻', text: 'Сделай сценарий страшнее' },
  { icon: '🎭', text: 'Добавь больше диалогов' },
  { icon: '🏆', text: 'Добавь достижения и награды' },
];

export default function AiEnhanceModal({ scenarioJson, onApply, onClose }: AiEnhanceModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = getAiGenerationsRemaining();
  const limit = getAiGenerationsLimit();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    const result = await generateScenario(prompt.trim(), scenarioJson);

    if (result.success && result.data) {
      onApply(result.data);
      onClose();
    } else {
      setError(result.error || 'Неизвестная ошибка');
    }

    setLoading(false);
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="text-lg font-semibold text-text-primary">AI-доработка сценария</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background-modifier-hover"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Лимиты */}
          <div className="flex items-center gap-2 text-xs text-text-secondary bg-background-modifier-hover rounded-lg px-3 py-2">
            <span>🔑</span>
            <span>
              Используется OpenRouter AI (бесплатно, {remaining}/{limit} генераций сегодня)
            </span>
          </div>

          {/* Поле ввода */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Что сделать?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: добавь больше заданий, сделай сложнее..."
              className="w-full h-24 px-3 py-2 bg-background-modifier-hover border border-border rounded-lg text-text-primary placeholder:text-text-secondary/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Быстрые идеи */}
          <div>
            <label className="block text-xs text-text-secondary mb-2">
              Быстрые идеи:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.text}
                  onClick={() => handleQuickPrompt(item.text)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    prompt === item.text
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                      : 'bg-background-modifier-hover border-border text-text-secondary hover:border-accent-primary/30 hover:text-text-primary'
                  }`}
                >
                  {item.icon} {item.text}
                </button>
              ))}
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-background-modifier-hover"
          >
            Отмена
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || remaining === 0}
            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <span>🧠</span>
                Сгенерировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}