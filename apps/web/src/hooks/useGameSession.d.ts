export interface Hint {
    level: 1 | 2 | 3;
    text: string;
    penalty: number;
    unlockedAt: number;
}
export interface NodeData {
    id: string;
    type: string;
    title: string;
    description: string;
    timeout?: number;
    hints?: Hint[];
    maxAttempts?: number;
}
export interface UseGameSessionOptions {
    onTimeout?: () => void;
    onHintUsed?: (level: number, penalty: number) => void;
    onAnswerSubmit?: (answer: string) => Promise<void>;
}
export declare function useGameSession(node: NodeData | null, options?: UseGameSessionOptions): {
    timeLeft: number;
    isTimerActive: boolean;
    hasTimedOut: boolean;
    unlockedHints: number[];
    usedHints: number[];
    showHints: boolean;
    setShowHints: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    useHint: (hint: Hint) => boolean;
    attempts: number;
    maxAttempts: number;
    feedback: {
        type: "success" | "error";
        message: string;
        points: number;
    } | null;
    setFeedback: import("react").Dispatch<import("react").SetStateAction<{
        type: "success" | "error";
        message: string;
        points: number;
    } | null>>;
    isTransitioning: boolean;
    submitAnswer: (answer: string) => Promise<boolean>;
    resetNode: () => void;
};
export declare function formatTime(seconds: number): string;
export declare function getTimerColor(seconds: number, total: number): string;
//# sourceMappingURL=useGameSession.d.ts.map