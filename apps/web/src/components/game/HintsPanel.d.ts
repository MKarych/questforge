import { Hint } from '@/hooks/useGameSession';
interface HintsPanelProps {
    hints: Hint[];
    unlockedLevels: number[];
    usedLevels: number[];
    onUseHint: (hint: Hint) => void;
    currentPenalty: number;
}
export default function HintsPanel({ hints, unlockedLevels, usedLevels, onUseHint, currentPenalty }: HintsPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=HintsPanel.d.ts.map