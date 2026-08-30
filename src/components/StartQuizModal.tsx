import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Quiz } from '../types/quiz';
import { getCategoryBreakdown, prepareQuizAttempt } from '../utils/quizUtils';
import { 
  Play, 
  X, 
  Layers, 
  Shuffle, 
  BookOpen, 
  Minus, 
  Plus 
} from 'lucide-react';

interface StartQuizModalProps {
  isOpen: boolean;
  quiz: Quiz | null;
  onClose: () => void;
  onConfirm: (preparedQuiz: Quiz) => void;
}

export const StartQuizModal: React.FC<StartQuizModalProps> = ({
  isOpen,
  quiz,
  onClose,
  onConfirm,
}) => {
  const totalQuestions = quiz?.questions.length ?? 0;
  const [customCount, setCustomCount] = useState<number | null>(null);
  const [randomizeOrder, setRandomizeOrder] = useState<boolean>(true);
  const [prevQuiz, setPrevQuiz] = useState<Quiz | null>(quiz);
  const [prevOpen, setPrevOpen] = useState<boolean>(isOpen);

  // Modal focus management: capture on open, restore focus to the trigger on close.
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    lastTriggerRef.current = document.activeElement as HTMLElement | null;
    // Background content in #root is inert while the modal is rendered in portal.
    const background = document.getElementById('root');
    if (background) background.setAttribute('inert', '');

    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(
        modalContainerRef.current?.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
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
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      background?.removeAttribute('inert');
      lastTriggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (quiz !== prevQuiz || isOpen !== prevOpen) {
    setPrevQuiz(quiz);
    setPrevOpen(isOpen);
    setCustomCount(null);
  }

  const selectedCount = customCount !== null ? customCount : totalQuestions;

  // Topic breakdown
  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(quiz?.questions ?? []);
  }, [quiz]);

  const categoryNames = useMemo(() => {
    return Object.keys(categoryBreakdown).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [categoryBreakdown]);

  // Dynamic quick presets
  const presets = useMemo(() => {
    if (totalQuestions === 0) return [];
    const list: number[] = [];
    if (totalQuestions <= 10) {
      if (totalQuestions >= 5) list.push(5);
    } else if (totalQuestions <= 30) {
      list.push(5, 10, 20);
    } else if (totalQuestions <= 60) {
      list.push(10, 25, 50);
    } else {
      list.push(15, 30, 50, 100);
    }
    const filtered = list.filter((p) => p < totalQuestions);
    filtered.push(totalQuestions); // Always include All
    return Array.from(new Set(filtered));
  }, [totalQuestions]);

  const handleCountChange = (value: number) => {
    const clamped = Math.max(1, Math.min(value, totalQuestions));
    setCustomCount(clamped);
  };

  const handleConfirm = () => {
    if (!quiz) return;
    const prepared = prepareQuizAttempt(quiz, selectedCount, randomizeOrder);
    onConfirm(prepared);
  };

  if (!isOpen || !quiz) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        ref={modalContainerRef}
        className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close configuration modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <h2 id="quiz-modal-title" className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            {quiz.title}
          </h2>
          {quiz.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Available Topics */}
        <div className="space-y-2 bg-slate-50 dark:bg-ink-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Topics ({categoryNames.length})</span>
            </div>
            <span className="text-slate-400">
              {totalQuestions} Qs
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {categoryNames.map((cat) => (
              <span
                key={cat}
                className="text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3 text-brand-500 dark:text-brand-400" />
                <span className="truncate max-w-[140px]">{cat}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">
                  ({categoryBreakdown[cat]})
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Question Count Selector Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
              Question count
            </label>
            <span className="text-xs md:text-sm font-bold text-brand-700 dark:text-brand-400">
              {selectedCount} of {totalQuestions}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedCount === preset;
              const label = preset === totalQuestions ? `All (${preset})` : `${preset}`;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleCountChange(preset)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer min-h-[38px] btn ${
                    isSelected
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Stepper + Slider Controller */}
          <div className="pt-0.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCountChange(selectedCount - 1)}
                disabled={selectedCount <= 1}
                aria-label="Decrease question count"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="range"
                  min="1"
                  max={totalQuestions}
                  value={selectedCount}
                  onChange={(e) => handleCountChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-brand-700"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCountChange(selectedCount + 1)}
                disabled={selectedCount >= totalQuestions}
                aria-label="Increase question count"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Shuffle Option Toggle */}
        <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Shuffle question order
            </span>
          </div>
          <input
            type="checkbox"
            checked={randomizeOrder}
            onChange={(e) => setRandomizeOrder(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
          />
        </label>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs md:text-sm font-bold cursor-pointer transition-colors btn"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-xs md:text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 btn"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Confirm & Start</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
