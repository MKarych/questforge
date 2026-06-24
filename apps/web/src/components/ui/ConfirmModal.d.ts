interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}
export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, variant, }: ConfirmModalProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=ConfirmModal.d.ts.map