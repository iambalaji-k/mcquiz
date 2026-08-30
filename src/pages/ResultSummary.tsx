import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fuzzyMatch } from '../utils/githubService';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Frown,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RotateCw, 
  PlusCircle,
  Search, 
  Filter, 
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Printer,
  FileText,
  Home,
  Sun,
  Moon
} from 'lucide-react';

export const ResultSummary: React.FC = () => {
  const {
    quiz,
    answers,
    score,
    timeSpent,
    loadNewQuiz,
    discardQuiz,
    theme,
    toggleTheme,
  } = useQuiz();

  const navigate = useNavigate();

  // Redirect if no quiz loaded
  useEffect(() => {
    if (!quiz) {
      navigate('/');
    }
  }, [quiz, navigate]);

  // Review Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string | number, boolean>>({});
  const [isAnotherQuizDialogOpen, setIsAnotherQuizDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  // 1. Confetti celebration on completion (minimum 40% required)
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (!quiz) return;
    if (celebratedRef.current) return;
    celebratedRef.current = true;

    const totalQuestions = quiz.questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Minimum 40% required for celebration animation
    if (scorePercentage < 40) return;

    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Immediate initial burst
    confetti({
      ...defaults,
      particleCount: 50,
      origin: { x: 0.5, y: 0.6 },
    });

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 60 * (timeLeft / duration);
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      });
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      });
    }, 250);

    return () => clearInterval(interval);
  }, [quiz, score]);

  // Get unique categories for filtration (alphabetically sorted, with 'All' first)
  const categories = useMemo(() => {
    if (!quiz) return ['All'];
    const list = new Set<string>();
    quiz.questions.forEach((q) => {
      if (q.category) list.add(q.category);
    });
    const sorted = Array.from(list).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return ['All', ...sorted];
  }, [quiz]);

  // Filter and Search Questions list (with Fuzzy Search & Unanswered filter)
  const filteredQuestions = useMemo(() => {
    if (!quiz) return [];
    return quiz.questions.filter((q) => {
      // 1. Fuzzy search filter (matches question text, explanation, options, or category)
      const matchesSearch = !searchTerm.trim() || 
                            fuzzyMatch(q.question, searchTerm) || 
                            fuzzyMatch(q.explanation, searchTerm) ||
                            q.options.some((opt) => fuzzyMatch(opt, searchTerm)) ||
                            fuzzyMatch(q.category, searchTerm);
      
      // 2. Category filter
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      
      // 3. Status filter (correct, incorrect, unanswered)
      const userAns = answers[q.id];
      const isAnswered = userAns !== undefined;
      const isCorrect = isAnswered && userAns === q.answer;
      const isIncorrect = isAnswered && userAns !== q.answer;
      const isUnanswered = !isAnswered;

      let matchesStatus = true;
      if (statusFilter === 'correct') {
        matchesStatus = isCorrect;
      } else if (statusFilter === 'incorrect') {
        matchesStatus = isIncorrect;
      } else if (statusFilter === 'unanswered') {
        matchesStatus = isUnanswered;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [quiz, answers, searchTerm, selectedCategory, statusFilter]);

  if (!quiz) return null;

  const totalQuestions = quiz.questions.length;
  const incorrectCount = Object.keys(answers).reduce((acc, qId) => {
    const q = quiz.questions.find((question) => question.id === qId || String(question.id) === String(qId));
    if (q && answers[qId] !== q.answer) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const correctCount = score;
  const unansweredCount = totalQuestions - Object.keys(answers).length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  // Time formatting helper
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const handleRetakeQuiz = () => {
    if (quiz) {
      loadNewQuiz(quiz);
      navigate('/quiz');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportMarkdown = () => {
    if (!quiz) return;

    let md = `# Quiz Results Report: ${quiz.title}\n\n`;
    md += `* **Date Completed**: ${new Date().toLocaleDateString()}\n`;
    md += `* **Score**: ${scorePercentage}% (${correctCount} / ${totalQuestions} Correct)\n`;
    md += `* **Incorrect Answers**: ${incorrectCount}\n`;
    md += `* **Unanswered Questions**: ${unansweredCount}\n`;
    md += `* **Time Spent**: ${formatTime(timeSpent)}\n\n`;
    md += `---\n\n`;
    md += `## Question Review\n\n`;

    quiz.questions.forEach((q, index) => {
      const num = index + 1;
      const userAns = answers[q.id];
      const isAnswered = userAns !== undefined;
      const isCorrect = isAnswered && userAns === q.answer;
      
      let status = 'Unanswered';
      if (isAnswered) {
        status = isCorrect ? '✅ Correct' : '❌ Incorrect';
      }

      md += `### Q${num}. ${q.question}\n`;
      md += `* **Category**: ${q.category}\n`;
      md += `* **Status**: ${status}\n`;
      
      if (isAnswered) {
        md += `* **Your Answer**: ${q.options[userAns]}\n`;
      }
      md += `* **Correct Answer**: ${q.options[q.answer]}\n\n`;
      md += `**Explanation**:\n${q.explanation}\n\n`;
      md += `---\n\n`;
    });

    md += `*Generated via QuizPlayer.*`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-results.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpandQuestion = (id: string | number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Score badge configurations
  let badgeColor: string;
  let badgeText: string;

  if (scorePercentage >= 80) {
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    badgeText = 'Excellent performance';
  } else if (scorePercentage >= 50) {
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    badgeText = 'Passed';
  } else {
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    badgeText = 'Needs practice';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col min-h-screen print:bg-white print:text-black">
      
      {/* Top Navigation Header */}
      <header className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <button
          onClick={() => setIsExitDialogOpen(true)}
          className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Exit</span>
        </button>

        <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-300">
          Result Summary
        </p>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>
      
      {/* Print-Only Header */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-slate-300 pb-3 mb-6">
        <div>
          <p className="text-lg font-bold text-slate-900">Exam Report</p>
          <p className="text-xs text-slate-500">{quiz.title}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>{new Date().toLocaleDateString()}</div>
          <div>Time: {formatTime(timeSpent)}</div>
        </div>
      </div>
      
      {/* Result Banner */}
      <section className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 md:p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-5 md:items-center">
          {/* Score block */}
          <div className="flex items-center gap-4 shrink-0">
            <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl border flex items-center justify-center ${
              scorePercentage >= 40
                ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-100 dark:border-brand-800'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/40'
            }`}>
              {scorePercentage >= 40 ? (
                <Trophy className="h-6 w-6 md:h-7 md:w-7 text-brand-600 dark:text-brand-400" />
              ) : (
                <Frown className="h-6 w-6 md:h-7 md:w-7 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                  {badgeText}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {scorePercentage}%
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-16 bg-slate-200 dark:border-slate-800 shrink-0"></div>

          {/* Title + stats */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-white truncate">
              {quiz.title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              <div className="bg-slate-50 dark:bg-ink-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900/60">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
                  <CheckCircle className="h-3 w-3" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Correct</span>
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white">{correctCount} / {totalQuestions}</span>
              </div>

              <div className="bg-slate-50 dark:bg-ink-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900/60">
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
                  <XCircle className="h-3 w-3" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Wrong</span>
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white">{incorrectCount}</span>
              </div>

              <div className="bg-slate-50 dark:bg-ink-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900/60">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Skipped</span>
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white">{unansweredCount}</span>
              </div>

              <div className="bg-slate-50 dark:bg-ink-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900/60">
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 mb-0.5">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Time</span>
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-white">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={handleRetakeQuiz}
            className="px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs md:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors btn shadow-sm"
          >
            <RotateCw className="h-4 w-4" />
            <span>Retake Quiz</span>
          </button>

          <button
            onClick={() => setIsAnotherQuizDialogOpen(true)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-ink-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs md:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors btn"
          >
            <PlusCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Take Another Quiz</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-ink-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs md:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors btn"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-ink-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-xs md:text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-colors btn"
          >
            <FileText className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </section>

      {/* Review Mode Section */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Review answers
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Compare your choice with the correct answer and read the explanation for each question.
          </p>
        </div>

        {/* Review Filters Header (Search & Category & Correctness Filters) */}
        <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-sm space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Input (5 cols) */}
            <div className="md:col-span-5 relative order-first">
              <label htmlFor="search" className="sr-only">Search questions</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search questions or explanations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-colors"
              />
            </div>

            {/* Category Select (3 cols) */}
            <div className="md:col-span-3 relative">
              <label htmlFor="category" className="sr-only">Filter by category</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base text-slate-800 dark:text-slate-200 transition-colors appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Status Filter Selector (4 cols: All / Correct / Wrong / Unanswered) */}
            <div className="md:col-span-4 flex border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-50/50 dark:bg-ink-900 gap-0.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-1.5 px-1 rounded-md transition-colors cursor-pointer text-center ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-ink-900 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('correct')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-1.5 px-1 rounded-md transition-colors cursor-pointer text-center ${
                  statusFilter === 'correct'
                    ? 'bg-white dark:bg-ink-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Correct
              </button>
              <button
                onClick={() => setStatusFilter('incorrect')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-1.5 px-1 rounded-md transition-colors cursor-pointer text-center ${
                  statusFilter === 'incorrect'
                    ? 'bg-white dark:bg-ink-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Wrong
              </button>
              <button
                onClick={() => setStatusFilter('unanswered')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-1.5 px-1 rounded-md transition-colors cursor-pointer text-center ${
                  statusFilter === 'unanswered'
                    ? 'bg-white dark:bg-ink-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Unanswered
              </button>
            </div>

          </div>
        </div>

        {/* Filtered Count indicator */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold print:hidden">
            Showing {filteredQuestions.length} of {totalQuestions} questions
          </p>
          {/* Announced when filters change the result count. */}
          <p role="status" className="sr-only">
            {filteredQuestions.length} of {totalQuestions} questions shown
          </p>
        </div>

        {/* Questions Review List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
              No questions match your search parameters.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const userAns = answers[q.id];
              const isAnswered = userAns !== undefined;
              const isCorrect = isAnswered && userAns === q.answer;
              const isExpanded = expandedQuestions[q.id] ?? false;

              const questionNum = quiz.questions.findIndex((item) => item.id === q.id) + 1;
              let indicatorColor = 'border-slate-200 dark:border-slate-800';
              let badge: React.ReactNode;

              if (isAnswered) {
                if (isCorrect) {
                  indicatorColor = 'border-emerald-500/30';
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                      <CheckCircle className="h-3 w-3" />
                      Correct
                    </span>
                  );
                } else {
                  indicatorColor = 'border-rose-500/30';
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30">
                      <XCircle className="h-3 w-3" />
                      Incorrect
                    </span>
                  );
                }
              } else {
                badge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Unanswered
                  </span>
                );
              }

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-ink-900 border rounded-xl overflow-hidden transition-colors shadow-sm ${indicatorColor}`}
                >
                  {/* Card Header (Clickable to collapse/expand) */}
                  <button
                    onClick={() => toggleExpandQuestion(q.id)}
                    aria-expanded={isExpanded}
                    className="w-full p-4 md:p-5 text-left flex items-start justify-between gap-4 cursor-pointer btn"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-brand-700 dark:text-brand-400">
                          Q{questionNum}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {q.category}
                        </span>
                        {badge}
                      </div>
                      <h3 className="font-read text-sm md:text-base font-medium text-slate-900 dark:text-paper-100 leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                    <div className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0 transition-colors print:hidden">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Card Expanded Content: smooth reveal via grid rows */}
                  <div className="reveal" data-open={isExpanded}>
                    <div className="px-4 pb-5 md:px-5 md:pb-6 border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-4 print:block">
                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptCorrect = q.answer === optIdx;
                          const isOptSelected = userAns === optIdx;
                          
                          let cardStyle = 'border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-ink-900 text-slate-700 dark:text-slate-300';
                          let icon = null;

                          if (isOptCorrect) {
                            cardStyle = 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300 font-bold';
                            icon = <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
                          } else if (isOptSelected) {
                            cardStyle = 'border-rose-200 bg-rose-500/10 dark:border-rose-900/30 text-rose-900 dark:text-rose-300 font-bold';
                            icon = <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border flex justify-between items-center text-sm md:text-base ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-5 w-5 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isOptSelected
                                    ? 'bg-rose-500 border-rose-500 text-white'
                                    : isOptCorrect
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {icon}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      <div className="bg-paper-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
                          <Info className="h-3.5 w-3.5" />
                          <span>Explanation</span>
                        </div>
                        <p className="font-read text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Exit confirmation */}
      <ConfirmDialog
        isOpen={isExitDialogOpen}
        title="Exit to home?"
        message="Your results stay available from Home. You can return to this review anytime."
        confirmLabel="Exit"
        onConfirm={() => {
          setIsExitDialogOpen(false);
          navigate('/');
        }}
        onCancel={() => setIsExitDialogOpen(false)}
      />

      {/* Take Another Quiz confirmation */}
      <ConfirmDialog
        isOpen={isAnotherQuizDialogOpen}
        title="Take another quiz?"
        message="This will finish your current review session and take you to browse quizzes."
        confirmLabel="Browse Quizzes"
        onConfirm={() => {
          setIsAnotherQuizDialogOpen(false);
          discardQuiz();
          navigate('/explore');
        }}
        onCancel={() => setIsAnotherQuizDialogOpen(false)}
      />
    </div>
  );
};
