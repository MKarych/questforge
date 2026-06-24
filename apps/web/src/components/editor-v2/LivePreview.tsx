'use client';

import { Scene } from '@/lib/editor-store/editor.types';

interface LivePreviewProps {
  scene: Scene;
  allScenes: Scene[];
  onClose: () => void;
  onNavigate: (sceneId: string) => void;
}

export default function LivePreview({ scene, allScenes, onClose, onNavigate }: LivePreviewProps) {
  const taskNodes = allScenes.filter((n) => n.title !== 'Старт' && n.title !== 'Финиш');
  const currentIndex = taskNodes.findIndex((n) => n.id === scene.id);

  return (
    <div className="absolute bottom-4 right-4 z-50 w-80 bg-background rounded-xl shadow-2xl border border-border overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-text-primary">👁 Живое превью</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-secondary">
            {currentIndex >= 0 ? `${currentIndex + 1}/${taskNodes.length}` : ''}
          </span>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-sm ml-1">
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Title */}
        <h3 className="text-sm font-bold text-text-primary mb-1">{scene.title}</h3>

        {/* Description */}
        {scene.description && (
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">{scene.description}</p>
        )}

        {/* Missions */}
        {scene.missions.map((mission) => {
          const cfg = mission.config as any;
          return (
            <div key={mission.id} className="mb-3 p-3 bg-background/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{getMissionIcon(mission.type)}</span>
                <span className="text-xs font-semibold text-text-primary">{mission.title}</span>
              </div>
              {mission.description && (
                <p className="text-[11px] text-text-secondary mb-2">{mission.description}</p>
              )}

              {/* Text/Code input mock */}
              {(mission.type === 'text' || mission.type === 'code') && (
                <div className="space-y-1">
                  <input
                    type="text"
                    readOnly
                    placeholder={mission.type === 'code' ? 'Введите код...' : 'Введите ответ...'}
                    className="w-full p-2 text-xs bg-background border border-border rounded"
                  />
                  <button className="w-full py-1.5 bg-primary text-white text-xs rounded font-semibold opacity-80">
                    Отправить
                  </button>
                </div>
              )}

              {/* Choice mock */}
              {mission.type === 'choice' && cfg?.options && (
                <div className="space-y-1">
                  {cfg.options.map((opt: string, idx: number) => (
                    <div key={idx} className="p-2 text-xs bg-background border border-border rounded">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Audio/Video mock */}
              {(mission.type === 'audio' || mission.type === 'video') && (
                <div className="bg-background rounded p-2 text-center text-[11px] text-text-secondary border border-border">
                  {mission.type === 'audio' ? '🎵 Аудио' : '🎬 Видео'}
                  {cfg?.assetId && <div className="text-[10px] text-text-secondary mt-0.5">ID: {cfg.assetId}</div>}
                </div>
              )}

              {/* Image mock */}
              {mission.type === 'image' && (
                <div className="bg-background rounded p-3 text-center text-[11px] text-text-secondary border border-border">
                  🖼 {cfg?.caption || 'Изображение'}
                </div>
              )}

              {/* Inventory mock */}
              {mission.type === 'inventory_get' && (
                <div className="text-[11px] text-green-400">🎒 +{cfg?.itemName || cfg?.itemId}</div>
              )}
              {mission.type === 'inventory_spend' && (
                <div className="text-[11px] text-orange-400">📦 -{cfg?.itemName || cfg?.itemId}</div>
              )}
              {mission.type === 'inventory_check' && (
                <div className="text-[11px] text-cyan-400">🔍 {cfg?.itemName || cfg?.itemId}</div>
              )}

              {/* Achievement mock */}
              {mission.type === 'achievement' && (
                <div className="text-[11px] text-yellow-400">🏆 {cfg?.achievementName || cfg?.achievementId}</div>
              )}

              {/* Hints */}
              {mission.hints.length > 0 && (
                <div className="mt-1 text-[10px] text-yellow-500 bg-yellow-500/10 p-1.5 rounded">
                  💡 {mission.hints[0].text}
                </div>
              )}
            </div>
          );
        })}

        {/* GPS info */}
        {scene.metadata?.gps && (
          <div className="text-[10px] text-text-secondary border-t border-border pt-2 mt-2">
            📍 {scene.metadata.gps.lat.toFixed(4)}, {scene.metadata.gps.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-background/50">
        <button
          onClick={() => currentIndex > 0 && onNavigate(taskNodes[currentIndex - 1].id)}
          disabled={currentIndex <= 0}
          className="px-2 py-1 text-[11px] bg-background border border-border rounded hover:bg-background/80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <span className="text-[10px] text-text-secondary">
          {currentIndex >= 0 ? `${currentIndex + 1} / ${taskNodes.length}` : ''}
        </span>
        <button
          onClick={() => currentIndex < taskNodes.length - 1 && onNavigate(taskNodes[currentIndex + 1].id)}
          disabled={currentIndex >= taskNodes.length - 1}
          className="px-2 py-1 text-[11px] bg-background border border-border rounded hover:bg-background/80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}

function getMissionIcon(type: string): string {
  const icons: Record<string, string> = {
    text: '📝', code: '🔢', photo: '📷', gps: '📍', qr: '📱',
    choice: '🎯', collect: '🎒', dialogue: '💬',
    audio: '🎵', video: '🎬', image: '🖼',
    inventory_get: '🎒', inventory_spend: '📦', inventory_check: '🔍',
    achievement: '🏆',
  };
  return icons[type] || '📋';
}