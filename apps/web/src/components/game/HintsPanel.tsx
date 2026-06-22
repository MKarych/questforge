import { useState } from 'react';
import { Hint } from '@/hooks/useGameSession';

interface HintsPanelProps {
  hints: Hint[];
  unlockedLevels: number[];
  usedLevels: number[];
  onUseHint: (hint: Hint) => void;
  currentPenalty: number;
}

export default function HintsPanel({ hints, unlockedLevels, usedLevels, onUseHint, currentPenalty }: HintsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getHintIcon = (level: number) => {
    switch (level) {
      case 1: return '💡';
      case 2: return '🔍';
      case 3: return '🎯';
      default: return '❓';
    }
  };

  const getHintLabel = (level: number) => {
    switch (level) {
      case 1: return 'Лёгкая';
      case 2: return 'Средняя';
      case 3: return 'Полная';
      default: return '';
    }
  };

  const availableHints = hints.filter(h => unlockedLevels.includes(h.level) && !usedLevels.includes(h.level));
  const usedHints = hints.filter(h => usedLevels.includes(h.level));

  return (
    <div className="card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span className="font-semibold text-text-primary">Подсказки</span>
          {availableHints.length > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {availableHints.length}
            </span>
          )}
        </div>
        <span className="text-text-secondary">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {hints.map((hint) => {
            const isUnlocked = unlockedLevels.includes(hint.level);
            const isUsed = usedLevels.includes(hint.level);
            
            return (
              <div
                key={hint.level}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isUsed
                    ? 'bg-success/10 border-success'
                    : isUnlocked
                    ? 'bg-background border-primary hover:border-primary/50'
                    : 'bg-surface border-border opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getHintIcon(hint.level)}</span>
                    <span className="text-sm font-medium text-text-primary">
                      {getHintLabel(hint.level)} подсказка
                    </span>
                  </div>
                  {isUsed ? (
                    <span className="text-success font-bold">✓</span>
                  ) : isUnlocked ? (
                    <span className="text-error text-sm font-medium">-{Math.abs(hint.penalty)} очк.</span>
                  ) : (
                    <span className="text-text-secondary text-xs">🔒 {hint.unlockedAt}с</span>
                  )}
                </div>

                {isUsed ? (
                  <p className="text-text-secondary text-sm pl-7">{hint.text}</p>
                ) : isUnlocked ? (
                  <button
                    onClick={() => onUseHint(hint)}
                    disabled={isUsed}
                    className="btn-secondary text-sm w-full mt-2"
                  >
                    Использовать (-{Math.abs(hint.penalty)} очк.)
                  </button>
                ) : (
                  <p className="text-text-secondary text-sm pl-7 italic">
                    Откроется через {hint.unlockedAt} секунд
                  </p>
                )}
              </div>
            );
          })}

          {usedHints.length > 0 && (
            <div className="text-xs text-text-secondary text-center mt-2">
              Общий штраф за подсказки: <span className="text-error font-bold">{currentPenalty}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
