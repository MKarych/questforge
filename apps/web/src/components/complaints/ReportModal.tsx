'use client';

import { useState } from 'react';
import { createComplaint, ComplaintTargetType, ComplaintReason } from '@/lib/api/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ComplaintTargetType;
  targetId: string;
  targetLabel?: string;
}

const REASON_LABELS: Record<ComplaintReason, string> = {
  SPAM: 'Спам',
  ABUSE: 'Оскорбления',
  NSFW: 'Неприемлемый контент (18+)',
  COPYRIGHT: 'Нарушение авторских прав',
  FRAUD: 'Мошенничество',
  HARASSMENT: 'Преследование',
  IMPERSONATION: 'Выдача себя за другого',
  FALSE_INFO: 'Недостоверная информация',
  OTHER: 'Другое',
};

const REASONS: ComplaintReason[] = [
  'SPAM',
  'ABUSE',
  'NSFW',
  'COPYRIGHT',
  'FRAUD',
  'HARASSMENT',
  'IMPERSONATION',
  'FALSE_INFO',
  'OTHER',
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetLabel }: ReportModalProps) {
  const [reason, setReason] = useState<ComplaintReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    setError(null);

    try {
      await createComplaint({
        targetType,
        targetId,
        reason: reason as ComplaintReason,
        description: description.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка при отправке жалобы');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setReason('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Жалоба отправлена</h3>
            <p className="text-text-secondary text-sm">
              Спасибо! Модераторы рассмотрят вашу жалобу в ближайшее время.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Пожаловаться</h3>
              <button
                onClick={handleClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            {targetLabel && (
              <p className="text-sm text-text-secondary mb-4">
                На что жалуетесь: <span className="text-text-primary font-medium">{targetLabel}</span>
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Причина жалобы <span className="text-error">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ComplaintReason)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите причину</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {REASON_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите подробнее, почему вы жалуетесь..."
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                  maxLength={2000}
                />
                <p className="text-xs text-text-secondary text-right mt-1">{description.length}/2000</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!reason || submitting}
                  className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Отправка...' : 'Отправить жалобу'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}