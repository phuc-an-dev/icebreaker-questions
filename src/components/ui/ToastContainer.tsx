'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Toast, ToastType } from '@/hooks/useToast';

const emptySubscribe = () => () => {};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; title: string; bar: string }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    bg: 'bg-slate-900/95',
    border: 'border-emerald-500/30',
    title: 'text-emerald-300',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    bg: 'bg-slate-900/95',
    border: 'border-red-500/30',
    title: 'text-red-300',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    bg: 'bg-slate-900/95',
    border: 'border-amber-500/30',
    title: 'text-amber-300',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
    bg: 'bg-slate-900/95',
    border: 'border-blue-500/30',
    title: 'text-blue-300',
    bar: 'bg-blue-500',
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = TOAST_CONFIG[toast.type];
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 4000;

  // Slide-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={handleDismiss}
      style={{
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}
      className={`relative flex items-start gap-3 w-80 px-4 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/60 cursor-pointer overflow-hidden select-none ${config.bg} ${config.border}`}
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
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition mt-0.5 p-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
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
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}
