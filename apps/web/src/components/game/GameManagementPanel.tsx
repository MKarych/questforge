'use client';

import { useState } from 'react';
import { cancelGame, rescheduleGame, moveToLobby } from '@/lib/api/client';

interface GameManagementPanelProps {
  gameId: string;
  gameStatus: string;
  onStatusChange: () => void;
}

export default function GameManagementPanel({ gameId, gameStatus, onStatusChange }: GameManagementPanelProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCancel = ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LOBBY'].includes(gameStatus);
  const canMoveToLobby = gameStatus === 'REGISTRATION_CLOSED';

  const handleAction = async (action: string, actionFn: () => Promise<any>) => {
    setLoading(action);
    setError(null);
    setSuccess(null);
    try {
      const res = await actionFn();
      setSuccess(res.data?.message || `Игра ${action === 'cancel' ? 'отменена' : action === 'lobby' ? 'переведена в лобби' : 'перенесена'}`);
      onStatusChange();
    } catch (err: any) {
      setError(err?.message || `Ошибка при выполнении действия`);
    } finally {
      setLoading(null);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) return;
    await handleAction('reschedule', () => rescheduleGame(gameId, rescheduleDate, rescheduleTime));
    setShowReschedule(false);
  };

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Управление игрой</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="space-y-2">
        {/* Cancel game */}
        {canCancel && (
          <button
            onClick={() => handleAction('cancel', () => cancelGame(gameId))}
            disabled={loading === 'cancel'}
            className="w-full py-2 px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'cancel' ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Отменить игру
          </button>
        )}

        {/* Move to lobby */}
        {canMoveToLobby && (
          <button
            onClick={() => handleAction('lobby', () => moveToLobby(gameId))}
            disabled={loading === 'lobby'}
            className="w-full py-2 px-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'lobby' ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Перевести в лобби
          </button>
        )}

        {/* Reschedule */}
        {!showReschedule ? (
          <button
            onClick={() => setShowReschedule(true)}
            className="w-full py-2 px-3 border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-secondary transition-colors"
          >
            Перенести игру
          </button>
        ) : (
          <form onSubmit={handleReschedule} className="space-y-2 p-3 bg-surface-secondary rounded-lg">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Дата</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="input-field w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Время</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="input-field w-full text-sm"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading === 'reschedule'}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading === 'reschedule' ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => setShowReschedule(false)}
                className="py-2 px-3 border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-secondary transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}