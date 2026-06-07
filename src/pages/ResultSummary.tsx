import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RotateCw, 
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string | number, boolean>>({});

  // 1. Confetti celebration
  useEffect(() => {
    if (!quiz) return;

    // Launch confetti!
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

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
  }, [quiz]);

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

  // Get unique categories for filtration
  const categories = useMemo(() => {
    const list = new Set<string>();
    quiz.questions.forEach((q) => list.add(q.category));
    return ['All', ...Array.from(list)];
  }, [quiz]);

  // Filter and Search Questions list
  const filteredQuestions = useMemo(() => {
    return quiz.questions.filter((q) => {
      // 1. Search filter
      const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            q.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category filter
      const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
      
      // 3. Status filter (correct, incorrect, unanswered)
      const userAns = answers[q.id];
      const isCorrect = userAns !== undefined && userAns === q.answer;
      const isIncorrect = userAns !== undefined && userAns !== q.answer;

      let matchesStatus = true;
      if (statusFilter === 'correct') {
        matchesStatus = isCorrect;
      } else if (statusFilter === 'incorrect') {
        matchesStatus = isIncorrect;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [quiz, answers, searchTerm, selectedCategory, statusFilter]);

  const handleRestart = () => {
    if (window.confirm('Start another quiz? This will discard your current review results.')) {
      discardQuiz();
      navigate('/');
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
  let badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
  let badgeText = 'Completed';

  if (scorePercentage >= 80) {
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    badgeText = 'Excellent Performance!';
  } else if (scorePercentage >= 50) {
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    badgeText = 'Passed';
  } else {
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    badgeText = 'Needs Practice';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen print:bg-white print:text-black">
      
      {/* Top Navigation Header */}
      <header className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <button
          onClick={() => {
            if (window.confirm('Exit to home? Your quiz summary is reviewed.')) {
              navigate('/');
            }
          }}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Exit to Home</span>
        </button>

        <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-300 font-outfit">
          Quiz Completed
        </h2>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </header>
      
      {/* Print-Only Header */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-slate-350 pb-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-outfit">QuizPlayer Practice Exam Report</h1>
          <p className="text-xs text-slate-500 font-semibold">{quiz.title}</p>
        </div>
        <div className="text-right text-xs text-slate-500 font-medium">
          <div>Date Completed: {new Date().toLocaleDateString()}</div>
          <div>Time Elapsed: {formatTime(timeSpent)}</div>
        </div>
      </div>
      
      {/* Top Banner Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-100/40 dark:shadow-none mb-8 space-y-8 text-center relative overflow-hidden">
        {/* Subtle gradient glow behind logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-4 relative">
          <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="h-9 w-9 md:h-11 md:w-11 text-white animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
              {badgeText}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-outfit truncate max-w-lg mx-auto">
              {quiz.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold">
              Attempt completed successfully.
            </p>
          </div>
        </div>

        {/* Circular Metric + Core Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2 max-w-3xl mx-auto">
          {/* Big Score Gauge (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center">
              {/* Circular progress background */}
              <svg className="w-36 h-36 md:w-44 md:w-44 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * scorePercentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-outfit">
                  {scorePercentage}%
                </span>
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Final Score
                </span>
              </div>
            </div>
          </div>

          {/* Stats Breakdown (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900/60 flex items-center gap-3.5 text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Correct</span>
                <span className="text-lg font-black text-slate-800 dark:text-white font-outfit">{correctCount} / {totalQuestions}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900/60 flex items-center gap-3.5 text-left">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Incorrect</span>
                <span className="text-lg font-black text-slate-800 dark:text-white font-outfit">{incorrectCount}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900/60 flex items-center gap-3.5 text-left">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Unanswered</span>
                <span className="text-lg font-black text-slate-800 dark:text-white font-outfit">{unansweredCount}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900/60 flex items-center gap-3.5 text-left">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Time Taken</span>
                <span className="text-lg font-black text-slate-800 dark:text-white font-outfit">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Control CTA */}
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>

          <button
            onClick={handleExportMarkdown}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <FileText className="h-4 w-4" />
            Download Report as text
          </button>

          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <RotateCw className="h-4 w-4" />
            Start Another Quiz
          </button>
        </div>
      </section>

      {/* Review Mode Section */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-outfit">
            Review Answers
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold">
            Evaluate your choice and read corresponding explanation notes for each question.
          </p>
        </div>

        {/* Review Filters Header (Search & Category & Correctness Filters) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input (5 cols) */}
            <div className="md:col-span-5 relative">
              <label htmlFor="search" className="sr-only">Search questions</label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search questions or explanations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>

            {/* Category Select (4 cols) */}
            <div className="md:col-span-4 relative">
              <label htmlFor="category" className="sr-only">Filter by category</label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Correct/Incorrect/All Selector (3 cols) */}
            <div className="md:col-span-3 flex border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50/50 dark:bg-slate-950">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-2 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('correct')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-2 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'correct'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Correct
              </button>
              <button
                onClick={() => setStatusFilter('incorrect')}
                className={`flex-1 text-[11px] md:text-xs font-bold py-2 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'incorrect'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Wrong
              </button>
            </div>

          </div>
        </div>

        {/* Filtered Count indicator */}
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold print:hidden">
          Showing {filteredQuestions.length} of {totalQuestions} questions
        </p>

        {/* Questions Review List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400">
              No questions match your search parameters.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const userAns = answers[q.id];
              const isAnswered = userAns !== undefined;
              const isCorrect = isAnswered && userAns === q.answer;
              const isExpanded = expandedQuestions[q.id] ?? false;

              let questionNum = quiz.questions.findIndex((item) => item.id === q.id) + 1;
              let indicatorColor = 'border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-900';
              let badge = null;

              if (isAnswered) {
                if (isCorrect) {
                  indicatorColor = 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10';
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                      <CheckCircle className="h-3 w-3" />
                      Correct
                    </span>
                  );
                } else {
                  indicatorColor = 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10';
                  badge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30">
                      <XCircle className="h-3 w-3" />
                      Incorrect
                    </span>
                  );
                }
              } else {
                badge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Unanswered
                  </span>
                );
              }

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden transition-all shadow-sm ${indicatorColor}`}
                >
                  {/* Card Header (Clickable to collapse/expand) */}
                  <button
                    onClick={() => toggleExpandQuestion(q.id)}
                    className="w-full p-5 md:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Q{questionNum}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {q.category}
                        </span>
                        {badge}
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.question}
                      </h3>
                    </div>
                    <div className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0 transition-all print:hidden">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Card Expanded Content */}
                  <div className={`px-5 pb-6 md:px-6 md:pb-8 border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4 ${
                    isExpanded ? 'block' : 'hidden print:block'
                  }`}>
                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isOptCorrect = q.answer === optIdx;
                          const isOptSelected = userAns === optIdx;
                          
                          let cardStyle = 'border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-950 text-slate-700 dark:text-slate-300';
                          let icon = null;

                          if (isOptCorrect) {
                            cardStyle = 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300 font-bold';
                            icon = <Check className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />;
                          } else if (isOptSelected) {
                            cardStyle = 'border-rose-200 bg-rose-500/10 dark:border-rose-900/30 text-rose-900 dark:text-rose-300 font-bold';
                            icon = <X className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />;
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border flex justify-between items-center text-xs md:text-sm ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-6 w-6 rounded-lg border flex items-center justify-center text-[10px] font-bold shrink-0 ${
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
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/50 rounded-2xl p-4 md:p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                          <Info className="h-4 w-4" />
                          <span>EXPLANATION</span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
