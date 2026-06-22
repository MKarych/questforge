'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSessionState,
  submitAnswer as submitAnswerApi,
  type SessionState,
} from '@/lib/api/client';

interface UseGameOptions {
  sessionId: string;
  teamId: string;
  gameId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGameReturn {
  sessionState: SessionState | null;
  loading: boolean;
  error: string | null;
  submitAnswer: (nodeId: string, answer: string) => Promise<{
    success: boolean;
    message: string;
    nextNodeId?: string;
  }>;
  refresh: () => Promise<void>;
}

export function useGame({
  sessionId,
  teamId,
  gameId,
  autoRefresh = true,
  refreshInterval = 5000,
}: UseGameOptions): UseGameReturn {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const response = await getSessionState(teamId);
      setSessionState(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session state');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchState, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchState]);

  const submitAnswer = useCallback(
    async (nodeId: string, answer: string) => {
      try {
        const response = await submitAnswerApi(teamId, gameId, nodeId, answer);
        
        // Update local state
        setSessionState((prev) =>
          prev
            ? {
                ...prev,
                score: response.data.score,
                penalties: response.data.penalties,
                currentNodeId: response.data.nextNode?.id || prev.currentNodeId,
                history: response.data.history,
              }
            : null
        );

        return {
          success: response.data.status === 'success',
          message: response.data.message,
          nextNodeId: response.data.nextNode?.id,
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to submit answer',
        };
      }
    },
    [teamId, gameId]
  );

  return {
    sessionState,
    loading,
    error,
    submitAnswer,
    refresh: fetchState,
  };
}

export default useGame;
