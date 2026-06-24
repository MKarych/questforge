"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGame = useGame;
const react_1 = require("react");
const client_1 = require("@/lib/api/client");
function useGame({ sessionId: _sessionId, teamId, gameId, autoRefresh = true, refreshInterval = 5000, }) {
    const [sessionState, setSessionState] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchState = (0, react_1.useCallback)(async () => {
        try {
            const response = await (0, client_1.getSessionState)(teamId);
            setSessionState(response.data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch session state');
        }
        finally {
            setLoading(false);
        }
    }, [teamId]);
    (0, react_1.useEffect)(() => {
        fetchState();
    }, [fetchState]);
    (0, react_1.useEffect)(() => {
        if (!autoRefresh)
            return;
        const interval = setInterval(fetchState, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchState]);
    const submitAnswer = (0, react_1.useCallback)(async (nodeId, answer) => {
        try {
            const response = await (0, client_1.submitAnswer)(teamId, gameId, nodeId, answer);
            // Update local state
            setSessionState((prev) => prev
                ? {
                    ...prev,
                    score: response.data.score,
                    penalties: response.data.penalties,
                    currentNodeId: response.data.nextNode?.id || prev.currentNodeId,
                    history: response.data.history,
                }
                : null);
            return {
                success: response.data.status === 'success',
                message: response.data.message,
                nextNodeId: response.data.nextNode?.id,
            };
        }
        catch (err) {
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Failed to submit answer',
            };
        }
    }, [teamId, gameId]);
    return {
        sessionState,
        loading,
        error,
        submitAnswer,
        refresh: fetchState,
    };
}
exports.default = useGame;
//# sourceMappingURL=useGame.js.map