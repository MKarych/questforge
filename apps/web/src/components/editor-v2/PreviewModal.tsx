'use client';

import { Scene } from '@/lib/editor-store/editor.types';

interface PreviewModalProps {
  node: Scene | null;
  allScenes: Scene[];
  onClose: () => void;
  onNavigate: (sceneId: string) => void;
}

export default function PreviewModal({ node, allScenes, onClose, onNavigate }: PreviewModalProps) {
  if (!node) return null;

  const taskNodes = allScenes.filter(
    (n) => n.title !== 'Старт' && n.title !== 'Финиш'
  );
  const currentIndex = taskNodes.findIndex((n) => n.id === node.id);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-400">👁 Превью сценария</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Phone Container */}
        <div className="p-6 bg-gray-900 flex flex-col items-center">
          <div
            className="bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border-4 border-gray-700"
            style={{ width: 375, height: 812, maxWidth: '100%' }}
          >
            {/* Notch */}
            <div className="bg-gray-900 h-8 flex items-center justify-center relative">
              <div className="w-32 h-5 bg-gray-800 rounded-full"></div>
              <div className="absolute right-4 top-2 text-[10px] text-white font-semibold">
                {currentIndex + 1}/{taskNodes.length}
              </div>
            </div>

            {/* Header */}
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
              <div className="text-sm font-bold text-gray-800 truncate">{node.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {currentIndex >= 0
                  ? `Задание ${currentIndex + 1} из ${taskNodes.length}`
                  : node.title}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-5">
                {/* Description */}
                {node.description && (
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {node.description}
                  </div>
                )}

                {/* Missions */}
                {node.missions.map((mission) => {
                  const cfg = mission.config as any;
                  return (
                  <div key={mission.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMissionIcon(mission.type)}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {mission.title}
                      </span>
                    </div>

                    {mission.description && (
                      <p className="text-gray-600 text-sm">{mission.description}</p>
                    )}

                    {/* Audio / Video / Image — плеер */}
                    {(mission.type === 'audio' || mission.type === 'video') && (
                      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                        {mission.type === 'audio' ? '🎵 Аудиоплеер' : '🎬 Видеоплеер'}
                        <div className="text-xs text-gray-400 mt-1">
                          {cfg?.assetId ? `ID: ${cfg.assetId}` : 'Медиа не выбрано'}
                        </div>
                      </div>
                    )}

                    {mission.type === 'image' && (
                      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                        🖼 Изображение
                        <div className="text-xs text-gray-400 mt-1">
                          {cfg?.assetId ? `ID: ${cfg.assetId}` : 'Медиа не выбрано'}
                        </div>
                        {cfg?.caption && (
                          <p className="text-xs text-gray-500 mt-1">{cfg.caption}</p>
                        )}
                      </div>
                    )}

                    {/* Inventory get/spend/check */}
                    {mission.type === 'inventory_get' && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800">
                        🎒 Получить предмет: <strong>{cfg?.itemName || cfg?.itemId || '?'}</strong> x{cfg?.quantity || 1}
                      </div>
                    )}
                    {mission.type === 'inventory_spend' && (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-sm text-orange-800">
                        📦 Потратить предмет: <strong>{cfg?.itemName || cfg?.itemId || '?'}</strong> x{cfg?.quantity || 1}
                      </div>
                    )}
                    {mission.type === 'inventory_check' && (
                      <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg text-sm text-cyan-800">
                        🔍 Проверить предмет: <strong>{cfg?.itemName || cfg?.itemId || '?'}</strong> x{cfg?.quantity || 1}
                      </div>
                    )}

                    {/* Achievement */}
                    {mission.type === 'achievement' && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                        🏆 Достижение: <strong>{cfg?.achievementName || cfg?.achievementId || '?'}</strong>
                      </div>
                    )}

                    {/* Answer input placeholder */}
                    {(mission.type === 'text' || mission.type === 'code') && (
                      <div>
                        <input
                          type="text"
                          placeholder={
                            mission.type === 'code' ? 'Введите код...' : 'Введите ответ...'
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50"
                          readOnly
                        />
                        <button className="mt-2 w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold">
                          Отправить
                        </button>
                      </div>
                    )}

                    {/* Choice options */}
                    {mission.type === 'choice' && (mission.config as any)?.options && (
                      <div className="space-y-2">
                        {(mission.config as any).options.map((opt: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hints */}
                    {mission.hints.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                        <span className="font-semibold">💡 Подсказка:</span>{' '}
                        {mission.hints[0].text}
                      </div>
                    )}
                  </div>
                  );
                })}

                {/* GPS info */}
                {node.metadata?.gps && (
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    📍 {node.metadata.gps.lat.toFixed(4)}, {node.metadata.gps.lng.toFixed(4)}
                    {' '}(радиус: {node.metadata.gps.radius}м)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  onNavigate(taskNodes[currentIndex - 1].id);
                }
              }}
              disabled={currentIndex <= 0}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              ← Предыдущее
            </button>
            <span className="text-xs text-gray-400">
              {currentIndex >= 0
                ? `${currentIndex + 1} / ${taskNodes.length}`
                : ''}
            </span>
            <button
              onClick={() => {
                if (currentIndex < taskNodes.length - 1) {
                  onNavigate(taskNodes[currentIndex + 1].id);
                }
              }}
              disabled={currentIndex >= taskNodes.length - 1}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              Следующее →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    audio: '🎵',
    video: '🎬',
    image: '🖼',
    inventory_get: '🎒',
    inventory_spend: '📦',
    inventory_check: '🔍',
    achievement: '🏆',
  };
  return icons[type] || '📋';
}