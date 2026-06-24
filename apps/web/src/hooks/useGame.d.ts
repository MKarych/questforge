import { type SessionState } from '@/lib/api/client';
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
export declare function useGame({ sessionId: _sessionId, teamId, gameId, autoRefresh, refreshInterval, }: UseGameOptions): UseGameReturn;
export default useGame;
//# sourceMappingURL=useGame.d.ts.map