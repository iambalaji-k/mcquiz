import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  ChevronLeft, 
  Home, 
  Flag, 
  Info,
  Sun,
  Moon
} from 'lucide-react';

export const QuizPlayer: React.FC = () => {
  const {
    quiz,
    currentQuestionIndex,
    answers,
    timeSpent,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    completeQuiz,
    theme,
    toggleTheme,
  } = useQuiz();

  const navigate = useNavigate();

  const PAGE_SIZE = 50;
  const totalQuestions = quiz?.questions.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / PAGE_SIZE));
  const defaultPage = Math.floor(currentQuestionIndex / PAGE_SIZE);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const currentPage = Math.max(0, Math.min(selectedPage !== null ? selectedPage : defaultPage, totalPages - 1));
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Redirect to home if no quiz is loaded
  useEffect(() => {
    if (!quiz) {
      navigate('/');
    }
  }, [quiz, navigate]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (!quiz) return;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    const isAnswered = answers[currentQuestion.id] !== undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier key or repeat
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;

      // Ignore keys if user is typing (safety check)
      const target = document.activeElement as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      // Option selection keys (1 to 6)
      if (e.key >= '1' && e.key <= '6') {
        const optionIdx = parseInt(e.key, 10) - 1;
        if (optionIdx < currentQuestion.options.length && !isAnswered) {
          answerQuestion(currentQuestion.id, optionIdx);
        }
      }

      // Navigation keys
      if (e.key === 'ArrowLeft') {
        setSelectedPage(null);
        prevQuestion();
      } else if (e.key === 'ArrowRight') {
        setSelectedPage(null);
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quiz, currentQuestionIndex, answers, answerQuestion, prevQuestion, nextQuestion]);

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const totalAnswered = Object.keys(answers).length;

  // Pagination details for Question Palette
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalQuestions);
  const pageQuestions = quiz.questions.slice(startIndex, endIndex);

  const currentSelection = answers[currentQuestion.id];
  const isAnswered = currentSelection !== undefined;

  // Format time (MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (!isAnswered) {
      answerQuestion(currentQuestion.id, optionIdx);
    }
  };

  const handleFinishQuiz = () => {
    completeQuiz();
    navigate('/result');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-col min-h-screen">
      {/* Top Header Controls */}
      <header className="flex flex-wrap items-center justify-between gap-y-2 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <button
          onClick={() => setIsExitDialogOpen(true)}
          className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer py-1"
        >
          <Home className="h-4 w-4" />
          <span>Exit</span>
        </button>

        <h1 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-300 max-w-[50%] md:max-w-[40%] truncate text-center order-last md:order-none w-full md:w-auto">
          {quiz.title}
        </h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>{formatTime(timeSpent)}</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer print:hidden"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Question, Options, and Explanation Panel (Stable Min Height) */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-[460px] md:min-h-[520px]">
          <div className="space-y-3.5 flex-1">
            {/* Progress Section */}
            <div className="space-y-1">
              <div className="flex justify-between items-end text-xs font-semibold">
                <span className="text-brand-700 dark:text-brand-400 font-bold">
                  Q {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {progressPercent}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <section className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-sm space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-100 dark:border-brand-900/30">
                    {currentQuestion.category}
                  </span>
                </div>
                <h2 className="font-read text-base md:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options List (2-column layout to reclaim vertical space) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = currentSelection === idx;
                  const isCorrect = idx === currentQuestion.answer;
                  
                  let optionStyle = 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-ink-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/40';
                  let iconElement = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-semibold';
                      iconElement = <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                    } else if (isSelected) {
                      optionStyle = 'border-rose-500/50 bg-rose-500/10 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-semibold';
                      iconElement = <X className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />;
                    } else {
                      optionStyle = 'opacity-50 border-slate-100 dark:border-slate-800/60 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full p-2.5 md:p-3 rounded-lg border text-left flex items-center justify-between gap-2.5 transition-colors ${optionStyle} ${
                        !isAnswered ? 'cursor-pointer active:scale-[0.99] btn' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold border shrink-0 ${
                          isSelected 
                            ? 'bg-brand-700 border-brand-700 text-white' 
                            : isAnswered && isCorrect
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-snug">
                          {option}
                        </span>
                      </div>
                      {iconElement}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Inside/attached seamlessly to question card) */}
              {isAnswered && (
                <div className="bg-paper-100 dark:bg-ink-950/70 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3.5 space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-400 font-bold text-[11px] uppercase tracking-wider">
                    <Info className="h-3.5 w-3.5" />
                    <span>Explanation</span>
                  </div>
                  <p className="font-read text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Navigation Controls (Anchored cleanly at bottom, pushes down only if question is very long) */}
          <section className="flex items-stretch justify-between gap-2 pt-3 mt-auto">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:hover:bg-transparent font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors btn"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => {
                if (totalAnswered < totalQuestions) {
                  setIsSubmitDialogOpen(true);
                } else {
                  handleFinishQuiz();
                }
              }}
              className="flex-1 md:flex-none px-5 md:px-7 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors btn"
            >
              <Flag className="h-4 w-4 fill-white" />
              <span>Submit</span>
            </button>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:hover:bg-transparent font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors btn"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </main>

        {/* Right Side: Question Navigation Palette */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 md:p-4 space-y-3 self-start lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex justify-between items-center">
            <h4 className="text-xs md:text-sm font-bold text-slate-950 dark:text-white">
              Palette
            </h4>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {totalAnswered}/{totalQuestions}
            </span>
          </div>

          {/* Palette Pagination Controls (Conditional) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-ink-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60 print:hidden mb-1">
              <button
                onClick={() => setSelectedPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-ink-900 disabled:opacity-40 transition-colors cursor-pointer"
                aria-label="Previous palette page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                P{currentPage + 1}/{totalPages} (Q{startIndex + 1}-{endIndex})
              </span>
              <button
                onClick={() => setSelectedPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-ink-900 disabled:opacity-40 transition-colors cursor-pointer"
                aria-label="Next palette page"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Palette Grid: 5 in a row (10 rows for 50 items) */}
          <div className="grid grid-cols-5 gap-1.5">
            {pageQuestions.map((q, localIdx) => {
              const actualIdx = startIndex + localIdx;
              const qAns = answers[q.id];
              const isCurrent = actualIdx === currentQuestionIndex;
              const isQAnswered = qAns !== undefined;
              const isQCorrect = isQAnswered && qAns === q.answer;

              let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-ink-900/60 dark:hover:bg-ink-900 dark:text-slate-300 border-slate-200 dark:border-slate-700/50';

              if (isQAnswered) {
                if (isQCorrect) {
                  btnStyle = 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
                } else {
                  btnStyle = 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30';
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => jumpToQuestion(actualIdx)}
                  aria-label={`Jump to question ${actualIdx + 1}`}
                  className={`h-8 w-full rounded-md border flex items-center justify-center text-xs font-bold transition-colors cursor-pointer btn ${btnStyle} ${
                    isCurrent 
                      ? 'ring-2 ring-accent-500 ring-offset-1 dark:ring-offset-slate-950 border-accent-500 text-slate-900 dark:text-white' 
                      : ''
                  }`}
                >
                  {actualIdx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 shrink-0"></span>
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="h-2.5 w-2.5 rounded bg-rose-500/20 border border-rose-500/40 shrink-0"></span>
              <span>Wrong</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Exit confirmation */}
      <ConfirmDialog
        isOpen={isExitDialogOpen}
        title="Exit to home?"
        message="Your attempt is saved and can be resumed from Home."
        confirmLabel="Exit"
        onConfirm={() => {
          setIsExitDialogOpen(false);
          navigate('/');
        }}
        onCancel={() => setIsExitDialogOpen(false)}
      />

      {/* Submit confirmation (only when questions remain unanswered) */}
      <ConfirmDialog
        isOpen={isSubmitDialogOpen}
        title="Submit quiz?"
        message={`${totalQuestions - totalAnswered} of ${totalQuestions} questions are unanswered.`}
        confirmLabel="Submit"
        onConfirm={() => {
          setIsSubmitDialogOpen(false);
          handleFinishQuiz();
        }}
        onCancel={() => setIsSubmitDialogOpen(false)}
      />
    </div>
  );
};
