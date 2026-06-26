'use client';

import { useState } from 'react';
import { setTeamReady } from '@/lib/api/client';

interface TeamReadyPanelProps {
  gameId: string;
  teams: Array<{ id: string; name: string; status: string; readyAt: string | null }>;
  onStatusChange: () => void;
}

export default function TeamReadyPanel({ gameId, teams, onStatusChange }: TeamReadyPanelProps) {
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSetReady = async (teamId: string) => {
    setLoadingTeamId(teamId);
    setError(null);
    try {
      await setTeamReady(gameId, teamId);
      onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Ошибка');
    } finally {
      setLoadingTeamId(null);
    }
  };

  const readyTeams = teams.filter((t) => t.status === 'ready' || t.readyAt);
  const notReadyTeams = teams.filter((t) => t.status !== 'ready' && !t.readyAt);

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Готовность команд</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-text-secondary">Команды ещё не зарегистрировались</p>
      ) : (
        <div className="space-y-2">
          {/* Ready teams */}
          {readyTeams.length > 0 && (
            <div>
              <p className="text-xs text-green-400 font-medium mb-1">Готовы ({readyTeams.length})</p>
              {readyTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-text-primary">{team.name}</span>
                  </div>
                  <span className="text-[10px] text-text-secondary/60">
                    {team.readyAt ? new Date(team.readyAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Not ready teams */}
          {notReadyTeams.length > 0 && (
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-1">Ожидают ({notReadyTeams.length})</p>
              {notReadyTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-text-primary">{team.name}</span>
                  </div>
                  <button
                    onClick={() => handleSetReady(team.id)}
                    disabled={loadingTeamId === team.id}
                    className="px-2.5 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {loadingTeamId === team.id ? '...' : 'Готовы'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}