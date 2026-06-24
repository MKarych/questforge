'use client';

import { useState } from 'react';

interface AIAssistantProps {
  onGenerate: (prompt: string) => void;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { icon: '🏙️', text: 'Городской квест по центру Москвы с 10 точками' },
  { icon: '🏫', text: 'Квест для школьников на знание истории' },
  { icon: '🎄', text: 'Новогодний квест для корпоратива' },
  { icon: '🏖️', text: 'Пляжный квест с поиском сокровищ' },
  { icon: '🔬', text: 'Научный квест для музея' },
  { icon: '👻', text: 'Хэллоуин-квест с страшилками' },
];

export default function AIAssistant({ onGenerate, onClose }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Симулируем генерацию
    setTimeout(() => {
      onGenerate(prompt);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl shadow-lg animate-pulse-slow">
                🤖
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">AI-помощник</h2>
                <p className="text-xs text-text-secondary">Опишите сценарий — я создам структуру</p>
              </div>
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quick prompts */}
          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">📌 Быстрые идеи</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(qp.text)}
                  className="text-left p-2.5 rounded-lg border border-border bg-background/50 hover:bg-background hover:border-primary/30 transition-all text-xs text-text-primary flex items-center gap-2"
                >
                  <span>{qp.icon}</span>
                  <span className="line-clamp-2">{qp.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
              ✏️ Опишите сценарий
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: квест по парку Горького для пар на 2 часа, с романтическими заданиями, фото-точками и загадками..."
              className="input-field text-sm min-h-[120px] w-full resize-none"
              rows={4}
            />
          </div>

          {/* Features info */}
          <div className="flex flex-wrap gap-2 text-[10px] text-text-secondary">
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">🎯 Текстовые задания</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">📍 GPS-точки</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">📷 Фото-задания</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">🎯 Выбор вариантов</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">💬 Диалоги с NPC</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">🎒 Инвентарь</span>
            <span className="bg-primary/5 px-2 py-1 rounded-full border border-primary/10">🏆 Достижения</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-text-secondary">
            🔒 Промпты не сохраняются. AI генерирует структуру на месте.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isGenerating
                ? 'bg-primary/50 text-white cursor-wait'
                : prompt.trim()
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                  : 'bg-background/50 text-text-secondary cursor-not-allowed border border-border'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Генерация...
              </span>
            ) : (
              '🚀 Сгенерировать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}