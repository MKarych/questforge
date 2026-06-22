import { useState, useEffect, useCallback, useRef } from 'react';

export interface Hint {
  level: 1 | 2 | 3;
  text: string;
  penalty: number;
  unlockedAt: number; // seconds from start
}

export interface NodeData {
  id: string;
  type: string;
  title: string;
  description: string;
  timeout?: number; // seconds
  hints?: Hint[];
  maxAttempts?: number;
}

export interface UseGameSessionOptions {
  onTimeout?: () => void;
  onHintUsed?: (level: number, penalty: number) => void;
  onAnswerSubmit?: (answer: string) => Promise<void>;
}

export function useGameSession(
  node: NodeData | null,
  options: UseGameSessionOptions = {}
) {
  const { onTimeout, onHintUsed, onAnswerSubmit } = options;
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(node?.timeout || 0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Hints state
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [showHints, setShowHints] = useState(false);
  
  // Attempts state
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = node?.maxAttempts || 3;
  
  // Progress state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; points: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when node changes
  useEffect(() => {
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
  useEffect(() => {
    if (!isTimerActive || hasTimedOut) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          setHasTimedOut(true);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, hasTimedOut, onTimeout]);

  // Hint unlocking logic
  useEffect(() => {
    if (!node?.hints || hasTimedOut) return;

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
      if (hintTimerRef.current) clearInterval(hintTimerRef.current);
    };
  }, [node?.hints, hasTimedOut]);

  // Auto-hide feedback after animation
  useEffect(() => {
    if (!feedback) return;
    
    const timeout = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const useHint = useCallback((hint: Hint) => {
    if (usedHints.includes(hint.level)) return false;
    
    setUsedHints((prev) => [...prev, hint.level]);
    if (onHintUsed) onHintUsed(hint.level, hint.penalty);
    return true;
  }, [usedHints, onHintUsed]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!onAnswerSubmit || attempts >= maxAttempts) return false;
    
    setIsTransitioning(true);
    setAttempts((prev) => prev + 1);
    
    try {
      await onAnswerSubmit(answer);
    } finally {
      setIsTransitioning(false);
    }
    return true;
  }, [onAnswerSubmit, attempts, maxAttempts]);

  const resetNode = useCallback(() => {
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

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getTimerColor(seconds: number, total: number): string {
  const percentage = (seconds / total) * 100;
  if (percentage > 50) return 'text-success';
  if (percentage > 25) return 'text-warning';
  return 'text-error';
}
