interface FeedbackProps {
    type: 'success' | 'error';
    message: string;
    points: number;
    visible: boolean;
}
export default function Feedback({ type, message, points, visible }: FeedbackProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=Feedback.d.ts.map