import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { parseAndValidateQuiz } from '../utils/validation';
import { StartQuizModal } from '../components/StartQuizModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Quiz } from '../types/quiz';
import { 
  UploadCloud, 
  AlertCircle, 
  Download, 
  Play, 
  Sun, 
  Moon, 
  RefreshCw, 
  FileSpreadsheet, 
  Globe, 
  ArrowRight,
  Check,
  Code
} from 'lucide-react';

export const Home: React.FC = () => {
  const { quiz, isCompleted, loadNewQuiz, discardQuiz, theme, toggleTheme } = useQuiz();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<Quiz | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSchemaCopied, setIsSchemaCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateQuiz(content);
      if (result.isValid && result.quiz) {
        setPendingQuiz(result.quiz);
        setIsConfigModalOpen(true);
      } else {
        setErrors(result.errors);
      }
    };
    reader.onerror = () => {
      setErrors(['Failed to read the file. Please try again.']);
    };
    reader.readAsText(file);
  };

  const handleConfirmStart = (preparedQuiz: Quiz) => {
    loadNewQuiz(preparedQuiz);
    setIsConfigModalOpen(false);
    navigate('/quiz');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        processFile(file);
      } else {
        setErrors(['Invalid file type. Please upload a .json file.']);
      }
    }
  };

  const sampleJsonSchema = `{
  "title": "Income Tax Practice Set 01",
  "description": "Practice questions",
  "version": "1.0",
  "questions": [
    {
      "id": 1,
      "category": "Income Tax",
      "question": "What is the basic exemption limit?",
      "options": ["100000", "200000", "300000", "400000"],
      "answer": 2,
      "explanation": "Current exemption limit is ..."
    }
  ]
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-800 dark:bg-brand-700 flex items-center justify-center shadow-sm">
            <Play className="h-4 w-4 text-accent-300 fill-accent-300 translate-x-[1px]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            MCQuiz
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        {/* Resume Active Session Card */}
        {quiz && (
          <section className="bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wider block">
                {isCompleted ? 'Completed' : 'In Progress'} · {quiz.questions.length} Qs
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {quiz.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(isCompleted ? '/result' : '/quiz')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer btn"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{isCompleted ? 'Review' : 'Resume'}</span>
              </button>
              <button
                onClick={() => setIsDiscardDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-ink-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors cursor-pointer btn"
                title="Discard session"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </section>
        )}

        {/* Validation Errors Box */}
        {errors.length > 0 && (
          <section role="alert" className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 space-y-2 animate-slide-up">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <h3>Invalid Quiz File</h3>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-red-600 dark:text-red-400 max-h-[150px] overflow-y-auto">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Two Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Card 1: Quiz Explorer */}
          <div
            onClick={() => navigate('/explore')}
            className="bg-white dark:bg-ink-900 border-2 border-brand-500/50 hover:border-brand-600 dark:border-brand-500/40 dark:hover:border-brand-400 rounded-2xl p-6 md:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group min-h-[210px]"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Quiz Explorer
                </h2>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Browse and practice curated questions.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-400 group-hover:underline flex items-center gap-1.5">
                <span>Browse</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Card 2: Custom JSON Dropzone */}
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 md:p-7 transition-all flex flex-col justify-between cursor-pointer min-h-[210px] group ${
              isDragging
                ? 'border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40'
                : 'border-slate-300 hover:border-brand-500 dark:border-slate-700 dark:hover:border-brand-500 bg-white dark:bg-ink-900 shadow-sm'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="sr-only"
            />

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400 transition-colors flex items-center justify-center">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Load Quiz JSON
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Drop your custom quiz file here or click to browse.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs font-semibold">
              <span className="text-brand-700 dark:text-brand-400 group-hover:underline">Select file →</span>
            </div>
          </label>
        </div>

        {/* Bottom Utility Tools (Clear 3-Card Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Tool 1: CSV Converter */}
          <div
            onClick={() => navigate('/converter')}
            className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-700 rounded-xl p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer group shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  CSV Converter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Convert spreadsheets or CSV rows into quiz JSON
                </p>
              </div>
            </div>
            <div className="text-[11px] font-bold text-brand-700 dark:text-brand-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Open converter</span>
              <span>→</span>
            </div>
          </div>

          {/* Tool 2: Sample Quiz */}
          <a
            href="./sample-quiz.json"
            download="income-tax-quiz.json"
            className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-700 rounded-xl p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer group shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sample Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Download a demo quiz to test the application
                </p>
              </div>
            </div>
            <div className="text-[11px] font-bold text-brand-700 dark:text-brand-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Download .json</span>
              <span>↓</span>
            </div>
          </a>

          {/* Tool 3: Schema Viewer */}
          <button
            onClick={() => setShowSchemaModal(!showSchemaModal)}
            className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-700 rounded-xl p-4 flex flex-col justify-between gap-3 text-left transition-colors cursor-pointer group shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/40 flex items-center justify-center shrink-0">
                <Code className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  JSON Schema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  View the structure format required for custom quizzes
                </p>
              </div>
            </div>
            <div className="text-[11px] font-bold text-brand-700 dark:text-brand-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>{showSchemaModal ? 'Hide schema' : 'View schema'}</span>
              <span>{showSchemaModal ? '↑' : '↓'}</span>
            </div>
          </button>
        </section>

        {/* Schema Viewer Section (Expanded Below the 3 Buttons) */}
        {showSchemaModal && (
          <section className="bg-ink-900 text-slate-300 border border-slate-800 rounded-xl p-4 font-mono text-xs relative overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2.5 text-slate-400 font-sans font-semibold">
              <div className="flex items-center gap-2 text-xs">
                <Code className="h-3.5 w-3.5 text-brand-400" />
                <span>JSON schema format</span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sampleJsonSchema);
                  setIsSchemaCopied(true);
                  setTimeout(() => setIsSchemaCopied(false), 1500);
                }}
                className="text-brand-300 hover:text-brand-200 hover:underline cursor-pointer flex items-center gap-1 font-bold text-xs"
              >
                {isSchemaCopied ? <Check className="h-3.5 w-3.5" /> : null}
                {isSchemaCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="overflow-x-auto max-h-[220px] leading-relaxed select-all text-[11px]">
              {sampleJsonSchema}
            </pre>
          </section>
        )}
      </main>

      {/* Pre-test Configuration Confirmation Modal */}
      <StartQuizModal
        isOpen={isConfigModalOpen}
        quiz={pendingQuiz}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleConfirmStart}
      />

      {/* Discard session confirmation */}
      <ConfirmDialog
        isOpen={isDiscardDialogOpen}
        title="Discard this session?"
        message="Your attempt is saved locally and can be resumed from Home. Discarding clears it and lets you load a different quiz."
        confirmLabel="Discard session"
        onConfirm={() => {
          discardQuiz();
          setIsDiscardDialogOpen(false);
        }}
        onCancel={() => setIsDiscardDialogOpen(false)}
      />
    </div>
  );
};
