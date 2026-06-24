"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameSession = useGameSession;
exports.formatTime = formatTime;
exports.getTimerColor = getTimerColor;
const react_1 = require("react");
function useGameSession(node, options = {}) {
    const { onTimeout, onHintUsed, onAnswerSubmit } = options;
    // Timer state
    const [timeLeft, setTimeLeft] = (0, react_1.useState)(node?.timeout || 0);
    const [isTimerActive, setIsTimerActive] = (0, react_1.useState)(false);
    const [hasTimedOut, setHasTimedOut] = (0, react_1.useState)(false);
    // Hints state
    const [unlockedHints, setUnlockedHints] = (0, react_1.useState)([]);
    const [usedHints, setUsedHints] = (0, react_1.useState)([]);
    const [showHints, setShowHints] = (0, react_1.useState)(false);
    // Attempts state
    const [attempts, setAttempts] = (0, react_1.useState)(0);
    const maxAttempts = node?.maxAttempts || 3;
    // Progress state
    const [isTransitioning, setIsTransitioning] = (0, react_1.useState)(false);
    const [feedback, setFeedback] = (0, react_1.useState)(null);
    const timerRef = (0, react_1.useRef)(null);
    const hintTimerRef = (0, react_1.useRef)(null);
    // Start timer when node changes
    (0, react_1.useEffect)(() => {
        if (node?.timeout && !hasTimedOut) {
            setTimeLeft(node.timeout);
            setIsTimerActive(true);
            setHasTimedOut(false);
            setAttempts(0);
            setUnlockedHints([]);
            setUsedHints([]);
        }
    }, [node?.id, node?.timeout]);
    // Timer logic
    (0, react_1.useEffect)(() => {
        if (!isTimerActive || hasTimedOut) {
            if (timerRef.current)
                clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsTimerActive(false);
                    setHasTimedOut(true);
                    if (onTimeout)
                        onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };
    }, [isTimerActive, hasTimedOut, onTimeout]);
    // Hint unlocking logic
    (0, react_1.useEffect)(() => {
        if (!node?.hints || hasTimedOut)
            return;
        const startTime = Date.now();
        hintTimerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            node.hints?.forEach((hint) => {
                if (!unlockedHints.includes(hint.level) && elapsed >= hint.unlockedAt) {
                    setUnlockedHints((prev) => [...prev, hint.level]);
                }
            });
        }, 1000);
        return () => {
            if (hintTimerRef.current)
                clearInterval(hintTimerRef.current);
        };
    }, [node?.hints, hasTimedOut]);
    // Auto-hide feedback after animation
    (0, react_1.useEffect)(() => {
        if (!feedback)
            return;
        const timeout = setTimeout(() => setFeedback(null), 2000);
        return () => clearTimeout(timeout);
    }, [feedback]);
    const useHint = (0, react_1.useCallback)((hint) => {
        if (usedHints.includes(hint.level))
            return false;
        setUsedHints((prev) => [...prev, hint.level]);
        if (onHintUsed)
            onHintUsed(hint.level, hint.penalty);
        return true;
    }, [usedHints, onHintUsed]);
    const submitAnswer = (0, react_1.useCallback)(async (answer) => {
        if (!onAnswerSubmit || attempts >= maxAttempts)
            return false;
        setIsTransitioning(true);
        setAttempts((prev) => prev + 1);
        try {
            await onAnswerSubmit(answer);
        }
        finally {
            setIsTransitioning(false);
        }
        return true;
    }, [onAnswerSubmit, attempts, maxAttempts]);
    const resetNode = (0, react_1.useCallback)(() => {
        setIsTransitioning(false);
        setFeedback(null);
    }, []);
    return {
        // Timer
        timeLeft,
        isTimerActive,
        hasTimedOut,
        // Hints
        unlockedHints,
        usedHints,
        showHints,
        setShowHints,
        useHint,
        // Attempts
        attempts,
        maxAttempts,
        // Feedback
        feedback,
        setFeedback,
        isTransitioning,
        // Actions
        submitAnswer,
        resetNode,
    };
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function getTimerColor(seconds, total) {
    const percentage = (seconds / total) * 100;
    if (percentage > 50)
        return 'text-success';
    if (percentage > 25)
        return 'text-warning';
    return 'text-error';
}
//# sourceMappingURL=useGameSession.js.map