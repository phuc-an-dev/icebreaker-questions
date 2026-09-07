'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast, ToastType } from '@/hooks/useToast';
import { SPRING_PHYSICS } from '@/lib/motion';
import { hapticFeedback } from '@/lib/haptics';

const emptySubscribe = () => () => {};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; border: string; title: string; bar: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />,
    border: 'border-emerald-500/30',
    title: 'text-emerald-600 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />,
    border: 'border-red-500/30',
    title: 'text-red-600 dark:text-red-300',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />,
    border: 'border-amber-500/30',
    title: 'text-amber-600 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />,
    border: 'border-blue-500/30',
    title: 'text-blue-600 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (toast.type === 'success') hapticFeedback.success();
    else if (toast.type === 'error' || toast.type === 'warning') hapticFeedback.warning();
    else hapticFeedback.light();
  }, [toast.type]);

  const handleDismiss = () => {
    hapticFeedback.light();
    onDismiss(toast.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.94 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        transition: SPRING_PHYSICS.snappy,
      }}
      exit={{
        opacity: 0,
        x: 32,
        scale: 0.92,
        transition: { duration: 0.18, ease: 'easeIn' },
      }}
      role="alert"
      aria-live="polite"
      onClick={handleDismiss}
      className={`relative flex items-start gap-3 w-80 px-4 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/20 dark:shadow-black/60 cursor-pointer overflow-hidden select-none bg-[var(--bg-glass-heavy)] ${config.border}`}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.bar} opacity-70`}
        style={{
          animation: `toast-shrink ${duration}ms linear forwards`,
        }}
      />

      {config.icon}

      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-sm font-semibold leading-snug ${config.title}`}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-xs text-content-muted mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="shrink-0 text-content-muted hover:text-content transition mt-0.5 p-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient || toasts.length === 0) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        aria-label="Notifications"
        className="fixed top-6 right-6 z-[10000] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={onDismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
}
