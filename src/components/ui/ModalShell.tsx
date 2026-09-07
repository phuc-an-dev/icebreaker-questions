'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import {
  BACKDROP_VARIANTS,
  BOTTOM_SHEET_VARIANTS,
  DRAG_CONFIG,
  shouldDismissSheet,
} from '@/lib/motion';
import { hapticFeedback } from '@/lib/haptics';

const emptySubscribe = () => () => {};

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  subHeader?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSubmitting?: boolean;
  contentClassName?: string;
  hideCloseButton?: boolean;
  variant?: 'default' | 'danger';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

const ModalShellInner: React.FC<Omit<ModalShellProps, 'isOpen'>> = ({
  onClose,
  title,
  subtitle,
  icon,
  headerRight,
  subHeader,
  children,
  footer,
  maxWidth = 'lg',
  isSubmitting = false,
  contentClassName = 'p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar',
  hideCloseButton = false,
  variant = 'default',
}) => {
  const dragControls = useDragControls();

  // Lock body scroll while open with proper cleanup
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Esc key listener with proper lifecycle cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        hapticFeedback.light();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleClose = () => {
    if (!isSubmitting) {
      hapticFeedback.light();
      onClose();
    }
  };

  return (
    <motion.div
      variants={BACKDROP_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--overlay-backdrop)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-shell-title' : undefined}
    >
      <motion.div
        variants={BOTTOM_SHEET_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={DRAG_CONFIG.sheetConstraints}
        dragElastic={DRAG_CONFIG.sheetElastic}
        onDragEnd={(_, info) => {
          if (shouldDismissSheet(info.offset.y, info.velocity.y)) {
            handleClose();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${MAX_WIDTH_MAP[maxWidth]} bg-surface-card border-t sm:border border-edge rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
      >
        {/* Mobile drag handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="pt-2.5 pb-1 sm:hidden flex justify-center cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
        >
          <div className="w-12 h-1.5 bg-content-muted/40 rounded-full hover:bg-content-muted/60 transition-colors" />
        </div>

        {/* Ambient glow for danger modals */}
        {variant === 'danger' && (
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Modal Header */}
        {title && (
          <div
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
              dragControls.start(e);
            }}
            className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-edge bg-surface-card/80 shrink-0 touch-none sm:touch-auto select-none"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {icon && (
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    variant === 'danger'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400'
                  }`}
                >
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2
                  id="modal-shell-title"
                  className="text-base sm:text-lg font-bold text-content leading-tight truncate"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-content-muted hidden xs:block truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {headerRight}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-content-muted hover:text-content p-2 rounded-xl hover:bg-surface-elevated transition min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-40"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Optional Subheader (e.g. Tab switchers) */}
        {subHeader && <div className="shrink-0">{subHeader}</div>}

        {/* Scrollable Content Body */}
        <div className={contentClassName}>{children}</div>

        {/* Sticky Action Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-edge bg-surface-card/95 flex items-center justify-end gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const ModalShell: React.FC<ModalShellProps> = ({ isOpen, ...props }) => {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && <ModalShellInner {...props} />}
    </AnimatePresence>,
    document.body
  );
};
