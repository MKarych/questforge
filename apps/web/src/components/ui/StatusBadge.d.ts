export type GameStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'STARTED' | 'FINISHED' | 'REJECTED';
interface StatusBadgeProps {
    status: GameStatus | string;
    className?: string;
}
export default function StatusBadge({ status, className }: StatusBadgeProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=StatusBadge.d.ts.map