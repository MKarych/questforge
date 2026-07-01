'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getResolvedTemplates, ScenarioTemplate } from '@/lib/scenario-templates/scenario-templates';

interface ScenarioTemplatesModalProps {
  onSelect: (template: ScenarioTemplate) => void;
  onClose: () => void;
  onDontShowAgain?: () => void;
}

export default function ScenarioTemplatesModal({ onSelect, onClose, onDontShowAgain }: ScenarioTemplatesModalProps) {
  const [templates] = useState(() => getResolvedTemplates());

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-text-primary">🚀 Начать с шаблона</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">
              ✕
            </button>
          </div>
          <p className="text-text-secondary text-sm">
            Выберите готовую структуру сценария, чтобы быстро начать. Все шаблоны можно редактировать.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelect(template)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">
              Начать с пустого
            </button>
            <Link
              href="/help/editor-guide"
              target="_blank"
              className="btn-ghost text-sm flex items-center gap-1"
            >
              📖 Инструкция по редактору
            </Link>
            {onDontShowAgain && (
              <button
                onClick={() => {
                  onDontShowAgain();
                  onClose();
                }}
                className="text-[11px] text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-background-modifier-hover"
                title="Больше не показывать это окно при создании нового сценария"
              >
                🙈 Больше не показывать
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-secondary">
            💡 Шаблоны можно менять как угодно после создания
          </p>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: ScenarioTemplate; onSelect: () => void }) {
  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const difficultyLabels = { easy: 'Легко', medium: 'Средне', hard: 'Сложно' };

  return (
    <button
      onClick={onSelect}
      className="group text-left p-5 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-4 mb-3">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl shadow-lg`}>
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-primary text-base mb-1">{template.name}</h3>
          <p className="text-xs text-text-secondary line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${difficultyColors[template.difficulty]}`}>
          {difficultyLabels[template.difficulty]}
        </span>
        <span className="text-[10px] text-text-secondary bg-background/80 px-2 py-0.5 rounded-full border border-border">
          ⏱ {template.estimatedTime}
        </span>
        <span className="text-[10px] text-text-secondary bg-background/80 px-2 py-0.5 rounded-full border border-border">
          📍 {template.scenes.length} сцен
        </span>
        <span className="text-[10px] text-text-secondary bg-background/80 px-2 py-0.5 rounded-full border border-border">
          🔗 {template.edges.length} связей
        </span>
      </div>

      {/* Preview scenes */}
      <div className="mt-3 flex flex-wrap gap-1">
        {template.scenes.slice(0, 5).map((scene, idx) => (
          <span
            key={scene.id}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              scene.title === 'Старт' ? 'bg-green-500/20 text-green-400' :
              scene.title === 'Финиш' ? 'bg-red-500/20 text-red-400' :
              'bg-primary/10 text-primary'
            }`}
          >
            {idx === 0 ? '🚀' : idx === template.scenes.length - 1 ? '🏁' : '📄'} {scene.title}
          </span>
        ))}
        {template.scenes.length > 5 && (
          <span className="text-[10px] text-text-secondary">+{template.scenes.length - 5}</span>
        )}
      </div>
    </button>
  );
}