import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // On open: inert the background, focus the least destructive action
  // (Cancel), trap Tab inside. On close: restore focus to the trigger.
  useEffect(() => {
    if (!isOpen) return;

    const background = document.getElementById('root');
    const trigger = document.activeElement as HTMLElement | null;
    if (background) background.setAttribute('inert', '');
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea') ?? []
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      background?.removeAttribute('inert');
      trigger?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Announced once when the dialog opens. */}
      <div role="status" className="sr-only">
        {title}
      </div>
      <div
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 animate-fade-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={onCancel}
      >
        <div
          className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-modal-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p id="confirm-dialog-message" className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="flex-1 min-h-[44px] py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer transition-colors btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold cursor-pointer transition-colors btn"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
