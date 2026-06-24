'use client';

import { Scene, TestState } from '@/lib/editor-store/editor.types';

interface TestModalProps {
  testState: TestState;
  scenes: Scene[];
  onAnswer: (answer: string) => void;
  onRestart: () => void;
  onClose: () => void;
}

export default function TestModal({
  testState,
  scenes,
  onAnswer,
  onRestart,
  onClose,
}: TestModalProps) {
  const currentNode = scenes.find((n) => n.id === testState.currentSceneId);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-white font-semibold">🎮 Тестирование сценария</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Score & Variables Bar */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-yellow-400 font-bold">⭐ {testState.score} очков</span>
              {Object.entries(testState.variables).filter(([k]) => k !== 'score').length > 0 && (
                <div className="flex gap-2 text-xs text-gray-400">
                  {Object.entries(testState.variables)
                    .filter(([k]) => k !== 'score')
                    .map(([key, val]) => (
                      <span key={key} className="bg-gray-700 px-2 py-1 rounded">
                        {key}: {String(val)}
                      </span>
                    ))}
                </div>
              )}
              {testState.inventory.items.length > 0 && (
                <div className="flex gap-1 text-xs text-gray-400">
                  {testState.inventory.items.map((item) => (
                    <span key={item.id} className="bg-gray-700 px-2 py-1 rounded">
                      🎒 {item.name} x{item.quantity}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onRestart} className="btn-secondary text-xs">
              🔄 Заново
            </button>
          </div>

          {/* Current Task */}
          {currentNode && !testState.finished && (
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{getNodeIcon(currentNode.type)}</span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentNode.title}</h3>
                  <span className="text-sm text-gray-400">
                    {scenes.findIndex((n) => n.id === testState.currentSceneId) > 0
                      ? `Задание ${scenes.findIndex((n) => n.id === testState.currentSceneId)}`
                      : 'Начало'}
                  </span>
                </div>
              </div>

              {currentNode.description && (
                <p className="text-gray-300 mb-4 text-lg">{currentNode.description}</p>
              )}

              {/* Missions */}
              {currentNode.missions.map((mission) => (
                <div key={mission.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getMissionIcon(mission.type)}</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {mission.title}
                    </span>
                  </div>

                  {mission.description && (
                    <p className="text-gray-400 text-sm mb-3">{mission.description}</p>
                  )}

                  {/* Hints */}
                  {mission.hints.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mb-3">
                      <span className="text-yellow-400 text-sm">
                        💡 Подсказка: {mission.hints[0].text}
                      </span>
                    </div>
                  )}

                  {/* Choice */}
                  {mission.type === 'choice' && (mission.config as any)?.options && (
                    <div className="space-y-2">
                      {(mission.config as any).options.map((opt: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => onAnswer(String(idx))}
                          className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition-colors border border-gray-600"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text / Code input */}
                  {(mission.type === 'text' || mission.type === 'code') && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={
                          mission.type === 'code' ? 'Введите код...' : 'Введите ответ...'
                        }
                        className="input-field text-sm w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onAnswer((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Нажмите Enter, чтобы отправить ответ
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Continue button for non-mission nodes */}
              {currentNode.missions.length === 0 && (
                <button
                  onClick={() => onAnswer('continue')}
                  className="btn-primary w-full"
                >
                  ➡️ Продолжить
                </button>
              )}
            </div>
          )}

          {/* Test Finished */}
          {testState.finished && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏁</div>
              <h2 className="text-2xl font-bold text-white mb-2">Сценарий пройден!</h2>
              <p className="text-gray-400 mb-2">
                Итоговый счёт:{' '}
                <span className="text-yellow-400 font-bold text-xl">{testState.score}</span>
              </p>
              <button onClick={onRestart} className="btn-primary mt-4">
                🔄 Пройти заново
              </button>
            </div>
          )}

          {/* Test Log */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">📋 Лог тестирования</h4>
            <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
              {testState.log.map((entry, idx) => (
                <p
                  key={idx}
                  className={`text-xs ${
                    entry.type === 'success'
                      ? 'text-green-400'
                      : entry.type === 'fail'
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {entry.message}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    location: '📍',
    quiz: '📝',
    dialogue: '🗣',
    conference: '🎪',
    rpg: '⚔️',
    custom: '🔧',
  };
  return icons[type] || '📄';
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
  };
  return icons[type] || '📋';
}