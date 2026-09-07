'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemCount?: number;
  confirmLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemCount,
  confirmLabel = 'Delete Permanently',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  const footer = (
    <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onCancel}
        disabled={isDeleting}
        className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-secondary hover:text-content bg-surface-elevated hover:bg-surface-elevated/80 border border-edge rounded-xl transition min-h-[44px]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDeleting}
        className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
      >
        {isDeleting && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        <span>{confirmLabel}</span>
      </button>
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />}
      maxWidth="md"
      variant="danger"
      isSubmitting={isDeleting}
      footer={footer}
      contentClassName="p-5 sm:p-6 space-y-4"
    >
      <p className="text-sm text-content-secondary leading-relaxed">
        {message}
        {typeof itemCount === 'number' && itemCount > 0 && (
          <span className="block mt-2 font-mono text-xs text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
            Total items affected: {itemCount}
          </span>
        )}
      </p>
    </ModalShell>
  );
};
