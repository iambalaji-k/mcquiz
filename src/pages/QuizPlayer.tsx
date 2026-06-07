import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  ChevronLeft, 
  Home, 
  Flag, 
  Info,
  CheckCircle2,
  XCircle
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
  } = useQuiz();

  const navigate = useNavigate();

  // Redirect to home if no quiz is loaded
  useEffect(() => {
    if (!quiz) {
      navigate('/');
    }
  }, [quiz, navigate]);

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const totalAnswered = Object.keys(answers).length;

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

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys if user is typing (safety check)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Option selection keys (1 to 6)
      if (e.key >= '1' && e.key <= '6') {
        const optionIdx = parseInt(e.key) - 1;
        if (optionIdx < currentQuestion.options.length && !isAnswered) {
          answerQuestion(currentQuestion.id, optionIdx);
        }
      }

      // Navigation keys
      if (e.key === 'ArrowLeft') {
        prevQuestion();
      } else if (e.key === 'ArrowRight') {
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestion, isAnswered, answerQuestion, prevQuestion, nextQuestion]);

  const handleOptionSelect = (optionIdx: number) => {
    if (!isAnswered) {
      answerQuestion(currentQuestion.id, optionIdx);
    }
  };

  const handleFinishQuiz = () => {
    // Confirm if they haven't answered all questions
    if (totalAnswered < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have only answered ${totalAnswered} out of ${totalQuestions} questions. Do you want to submit and complete the quiz?`
      );
      if (!confirmSubmit) return;
    }
    completeQuiz();
    navigate('/result');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 flex flex-col min-h-screen">
      {/* Top Header Controls */}
      <header className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to exit? Your current progress will be kept in memory.')) {
              navigate('/');
            }
          }}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Exit to Home</span>
        </button>

        <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-300 max-w-[50%] truncate text-center font-outfit">
          {quiz.title}
        </h2>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          <span>{formatTime(timeSpent)}</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Question and Options Panel (8 cols) */}
        <main className="lg:col-span-8 space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-end text-xs md:text-sm font-semibold">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {progressPercent}% Complete
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-4">
            {/* Category Badge */}
            <div>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                {currentQuestion.category}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed font-outfit">
              {currentQuestion.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = currentQuestion.answer === idx;
                const isSelected = currentSelection === idx;
                
                let optionStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30';
                let iconElement = null;

                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/20';
                    iconElement = <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                  } else if (isSelected) {
                    optionStyle = 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/30 text-rose-950 dark:text-rose-300 font-semibold ring-2 ring-rose-500/20';
                    iconElement = <X className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />;
                  } else {
                    optionStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center gap-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${optionStyle} ${
                      !isAnswered ? 'cursor-pointer hover:scale-[1.005]' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs md:text-sm font-bold border transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : isAnswered && isCorrect
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm md:text-base text-slate-800 dark:text-slate-200">
                        {option}
                      </span>
                    </div>
                    {iconElement}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Correct / Incorrect Notification + Explanation (Conditional) */}
          {isAnswered && (
            <section className="space-y-4 animate-fade-in">
              {/* Outcome Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                currentSelection === currentQuestion.answer
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
              }`}>
                {currentSelection === currentQuestion.answer ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-bold">Correct Answer!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="text-sm font-bold">Incorrect Answer!</span>
                  </>
                )}
              </div>

              {/* Explanation Card */}
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs md:text-sm">
                  <Info className="h-4 w-4" />
                  <span>EXPLANATION</span>
                </div>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {currentQuestion.explanation}
                </p>
              </div>
            </section>
          )}

          {/* Navigation Controls */}
          <section className="flex items-center justify-between gap-4 pt-4">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:hover:bg-transparent font-bold text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>

            <button
              onClick={handleFinishQuiz}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 focus:outline-none"
            >
              <Flag className="h-4 w-4 fill-white" />
              <span>Submit Exam</span>
            </button>

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:hover:bg-transparent font-bold text-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 focus:outline-none"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>

          {/* Keyboard Shortcut Instructions (Desktop only) */}
          <p className="hidden md:block text-[10px] text-center text-slate-400 dark:text-slate-500 font-semibold pt-2">
            Tip: Press keyboard numbers 1–6 to select answers. Use Left/Right arrows to flip questions.
          </p>
        </main>

        {/* Right Side: Question Navigation Palette (4 cols) */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs md:text-sm font-bold text-slate-950 dark:text-white font-outfit">
              Question Palette
            </h4>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {totalAnswered} / {totalQuestions} Done
            </span>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 xs:grid-cols-6 md:grid-cols-8 lg:grid-cols-4 gap-2">
            {quiz.questions.map((q, idx) => {
              const qAns = answers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              const isQAnswered = qAns !== undefined;
              const isQCorrect = isQAnswered && qAns === q.answer;

              let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/50';

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
                  onClick={() => jumpToQuestion(idx)}
                  aria-label={`Jump to question ${idx + 1}`}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-xs md:text-sm font-extrabold transition-all cursor-pointer ${btnStyle} ${
                    isCurrent 
                      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 font-black scale-105 border-indigo-500' 
                      : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shrink-0"></span>
              <span>Not visited / Unanswered</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-emerald-500/15 border border-emerald-500/30 shrink-0"></span>
              <span className="text-emerald-700 dark:text-emerald-400">Answered correctly</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded bg-rose-500/15 border border-rose-500/30 shrink-0"></span>
              <span className="text-rose-700 dark:text-rose-400">Answered incorrectly</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
