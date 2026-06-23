import { cn } from '@/lib/utils';

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

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Подтверждение',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantClasses = {
    danger: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={cn('px-6 py-4', variantClasses[variant])}>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 bg-surface-elevated">
          <p className="text-text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'btn-primary',
              variant === 'danger' && '!bg-error hover:!bg-error/80'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
