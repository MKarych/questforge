'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentNode, requestHint, getInventory, getResources } from '@/lib/api/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SessionPanelProps {
  teamId: string;
}

export default function SessionPanel({ teamId }: SessionPanelProps) {
  const [activeTab, setActiveTab] = useState<'node' | 'inventory' | 'resources'>('node');
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nodeRes, invRes, resRes] = await Promise.allSettled([
        getCurrentNode(teamId),
        getInventory(teamId),
        getResources(teamId),
      ]);
      if (nodeRes.status === 'fulfilled') setCurrentNode(nodeRes.value.data);
      if (invRes.status === 'fulfilled') setInventory(invRes.value.data || []);
      if (resRes.status === 'fulfilled') setResources(resRes.value.data);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных сессии');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestHint = async () => {
    setHintLoading(true);
    try {
      const res = await requestHint(teamId);
      if (currentNode) {
        setCurrentNode({ ...currentNode, hint: res.data?.hint || currentNode.hint });
      }
      setHintRevealed(true);
    } catch (err: any) {
      setError(err?.message || 'Ошибка запроса подсказки');
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <button onClick={loadData} className="text-primary text-sm hover:underline">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="card flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('node')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'node'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Текущее задание
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Инвентарь ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'resources'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Ресурсы
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'node' && (
          <div>
            {currentNode ? (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{currentNode.title}</h3>
                <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">{currentNode.description}</p>

                {currentNode.mediaUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    {currentNode.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={currentNode.mediaUrl} controls className="w-full max-h-64 object-contain bg-black/20" />
                    ) : (
                      <img src={currentNode.mediaUrl} alt="" className="w-full max-h-64 object-contain bg-black/20" />
                    )}
                  </div>
                )}

                {/* Hint */}
                {currentNode.hint && (
                  <div className="mb-4">
                    {hintRevealed ? (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-400 font-medium mb-1">Подсказка:</p>
                        <p className="text-sm text-text-primary">{currentNode.hint}</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleRequestHint}
                        disabled={hintLoading}
                        className="px-4 py-2 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {hintLoading ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : null}
                        Запросить подсказку
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-text-secondary/60">
                  Начато: {new Date(currentNode.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <p className="text-text-secondary text-sm text-center py-8">Нет активного задания</p>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            {inventory.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-8">Инвентарь пуст</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {inventory.map((item: any) => (
                  <div key={item.id} className="card p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-lg">{item.icon || '📦'}</span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            {resources ? (
              <div className="space-y-4">
                {/* HP */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">HP</span>
                    <span className="text-text-primary font-medium">{resources.hp}/{resources.maxHp}</span>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(resources.hp / resources.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Energy */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Энергия</span>
                    <span className="text-text-primary font-medium">{resources.energy}/{resources.maxEnergy}</span>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(resources.energy / resources.maxEnergy) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Score */}
                <div className="card p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Счёт</span>
                    <span className="text-lg font-bold text-primary">{resources.score}</span>
                  </div>
                </div>

                {/* Bonuses */}
                {resources.bonuses && resources.bonuses.length > 0 && (
                  <div>
                    <p className="text-xs text-text-secondary font-medium mb-2">Бонусы</p>
                    <div className="space-y-1">
                      {resources.bonuses.map((bonus: any) => (
                        <div key={bonus.id} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{bonus.name}</span>
                          <span className="text-green-400">+{bonus.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-secondary text-sm text-center py-8">Нет данных о ресурсах</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}