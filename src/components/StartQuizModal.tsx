import React, { useState, useMemo } from 'react';
import type { Quiz } from '../types/quiz';
import { getCategoryBreakdown, prepareQuizAttempt } from '../utils/quizUtils';
import { 
  Play, 
  X, 
  Sparkles, 
  Layers, 
  Sliders, 
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

  const categoryNames = Object.keys(categoryBreakdown);

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close configuration modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
            <Sliders className="h-3.5 w-3.5" />
            <span>Practice Setup</span>
          </div>
          <h2 id="quiz-modal-title" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-outfit">
            {quiz.title}
          </h2>
          {quiz.description && (
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Available Topics & Concept Breakdown */}
        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-500" />
              <span>Available Topics ({categoryNames.length})</span>
            </div>
            <span className="text-slate-400 font-semibold">
              {totalQuestions} total questions
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {categoryNames.map((cat) => (
              <span
                key={cat}
                className="text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3 text-indigo-400" />
                <span className="truncate max-w-[140px]">{cat}</span>
                <span className="text-slate-400 dark:text-slate-500 font-bold">
                  ({categoryBreakdown[cat]})
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Question Count Selector Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Select Questions to Attempt
            </label>
            <span className="text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400 font-outfit">
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
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Stepper + Slider Controller */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCountChange(selectedCount - 1)}
                disabled={selectedCount <= 1}
                aria-label="Decrease question count"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer transition-all focus:outline-none"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="range"
                  min="1"
                  max={totalQuestions}
                  value={selectedCount}
                  onChange={(e) => handleCountChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCountChange(selectedCount + 1)}
                disabled={selectedCount >= totalQuestions}
                aria-label="Increase question count"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer transition-all focus:outline-none"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Balanced Randomization Banner */}
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-3.5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-indigo-950 dark:text-indigo-200 font-semibold leading-relaxed">
            <p>
              {selectedCount === totalQuestions
                ? `You are attempting all ${totalQuestions} questions across ${categoryNames.length} topics.`
                : `Questions will be randomly sampled in a balanced ratio across all ${categoryNames.length} topics.`}
            </p>
          </div>
        </div>

        {/* Shuffle Option Toggle */}
        <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 cursor-pointer select-none">
          <div className="flex items-center gap-2.5">
            <Shuffle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Randomize Concept & Question Sequence
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Interleaves topics for high-yield exam simulation
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={randomizeOrder}
            onChange={(e) => setRandomizeOrder(e.target.checked)}
            className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs md:text-sm font-bold cursor-pointer transition-all active:scale-98 focus:outline-none"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/25 cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 focus:outline-none"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Confirm & Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};
