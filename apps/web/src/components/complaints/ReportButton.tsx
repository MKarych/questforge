'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';
import { ComplaintTargetType } from '@/lib/api/client';

interface ReportButtonProps {
  targetType: ComplaintTargetType;
  targetId: string;
  targetLabel?: string;
  variant?: 'icon' | 'text' | 'menu-item';
  className?: string;
}

export default function ReportButton({
  targetType,
  targetId,
  targetLabel,
  variant = 'icon',
  className = '',
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`text-text-secondary hover:text-error transition-colors ${className}`}
          title="Пожаловаться"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
        </button>
        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetType={targetType}
          targetId={targetId}
          targetLabel={targetLabel}
        />
      </>
    );
  }

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-error transition-colors ${className}`}
        >
          🚨 Пожаловаться
        </button>
        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetType={targetType}
          targetId={targetId}
          targetLabel={targetLabel}
        />
      </>
    );
  }

  // variant === 'text'
  return (
    <>
      <button
        onClick={handleClick}
        className={`text-sm text-text-secondary hover:text-error transition-colors flex items-center gap-1 ${className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
        </svg>
        Пожаловаться
      </button>
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </>
  );
}