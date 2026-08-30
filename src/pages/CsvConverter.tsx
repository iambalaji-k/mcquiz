import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { parseCSV, convertCsvToQuiz } from '../utils/csvConverter';
import { validateQuiz } from '../utils/validation';
import { StartQuizModal } from '../components/StartQuizModal';
import type { Quiz } from '../types/quiz';
import { 
  ArrowLeft, 
  UploadCloud, 
  Play, 
  Download, 
  Copy, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  Code, 
  Sun, 
  Moon 
} from 'lucide-react';

export const CsvConverter: React.FC = () => {
  const { loadNewQuiz, theme, toggleTheme } = useQuiz();
  const navigate = useNavigate();

  // Inputs
  const [csvText, setCsvText] = useState('');
  const [title, setTitle] = useState('Income Tax Practice Set');
  const [description, setDescription] = useState('Practice questions converted from CSV.');
  const [answerIndexing, setAnswerIndexing] = useState<'1-indexed' | '0-indexed' | 'letter'>('1-indexed');
  const [autoGenerateIds, setAutoGenerateIds] = useState(true);

  // States
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [convertedQuizJson, setConvertedQuizJson] = useState<string>('');
  const [convertedQuizObj, setConvertedQuizObj] = useState<Quiz | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showExampleSchema, setShowExampleSchema] = useState(false);
  const [copiedState, setCopiedState] = useState<'json' | 'csv' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = (inputCsv: string) => {
    setErrors([]);
    setSuccess(false);
    setConvertedQuizJson('');

    if (!inputCsv.trim()) {
      setErrors(['Please upload a CSV file or paste some CSV text.']);
      return;
    }

    // 1. Parse CSV
    const rows = parseCSV(inputCsv);
    
    // 2. Convert to Quiz
    const conversion = convertCsvToQuiz(rows, {
      title,
      description,
      answerIndexing,
      autoGenerateIds,
    });

    if (conversion.errors.length > 0) {
      setErrors(conversion.errors);
      return;
    }

    if (!conversion.quiz) {
      setErrors(['An unexpected conversion error occurred.']);
      return;
    }

    // 3. Strict Schema Validation check
    const validation = validateQuiz(conversion.quiz);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Success
    setSuccess(true);
    setConvertedQuizObj(conversion.quiz);
    setConvertedQuizJson(JSON.stringify(conversion.quiz, null, 2));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      handleConvert(text);
    };
    reader.onerror = () => {
      setErrors(['Failed to read file.']);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCopyJson = () => {
    if (convertedQuizJson) {
      navigator.clipboard.writeText(convertedQuizJson);
      setCopiedState('json');
      setTimeout(() => setCopiedState(null), 1500);
    }
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(exampleCsvContent);
    setCopiedState('csv');
    setTimeout(() => setCopiedState(null), 1500);
  };

  const handleDownloadJson = () => {
    if (!convertedQuizJson) return;
    const blob = new Blob([convertedQuizJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-quiz.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlayQuizDirectly = () => {
    if (convertedQuizObj) {
      setIsConfigModalOpen(true);
    }
  };

  const handleConfirmStart = (preparedQuiz: Quiz) => {
    loadNewQuiz(preparedQuiz);
    setIsConfigModalOpen(false);
    navigate('/quiz');
  };

  const exampleCsvContent = `id,category,question,option_1,option_2,option_3,option_4,answer,explanation
1,Income Tax,Exemption limit for senior citizens?,"250,000","300,000","500,000","600,000",2,Senior citizen exemption limit is 300,000.
2,Deductions,Under which section is medical insurance premium deductible?,"Section 80C","Section 80D","Section 80E",,2,Section 80D covers health insurance premiums.`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-y-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </button>

        <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[40%]">
          CSV to JSON converter
        </h1>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg bg-slate-100 dark:bg-ink-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Options and Input Column (7 cols) */}
        <main className="lg:col-span-7 space-y-6">
          
          {/* Metadata settings Card */}
          <section className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
              1. Quiz metadata settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="quiz-title">Quiz title</label>
                <input
                  id="quiz-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Income Tax Exam Set"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base text-slate-800 dark:text-slate-200 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="quiz-desc">Quiz description</label>
                <input
                  id="quiz-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Practice questions on deductions"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base text-slate-800 dark:text-slate-200 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="answer-format">Answer indexing format</label>
                <select
                  id="answer-format"
                  value={answerIndexing}
                  onChange={(e) => setAnswerIndexing(e.target.value as '1-indexed' | '0-indexed' | 'letter')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base text-slate-800 dark:text-slate-200 transition-colors appearance-none cursor-pointer"
                >
                  <option value="1-indexed">1-indexed (e.g. 1, 2, 3, 4)</option>
                  <option value="0-indexed">0-indexed (e.g. 0, 1, 2, 3)</option>
                  <option value="letter">Letters (e.g. A, B, C, D)</option>
                </select>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 pt-5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer" htmlFor="auto-id">Auto-generate IDs</label>
                <input
                  id="auto-id"
                  type="checkbox"
                  checked={autoGenerateIds}
                  onChange={(e) => setAutoGenerateIds(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* CSV File Input Selector */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              2. Load CSV source data
            </h2>

            {/* Drag & Drop: a label wrapping the file input, so keyboard and
                screen reader activation come from the platform. */}
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`block border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group ${
                isDragging
                  ? 'border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40'
                  : 'border-slate-300 hover:border-brand-500 bg-white dark:border-slate-700 dark:bg-ink-900 dark:hover:border-brand-500 shadow-sm'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="sr-only"
              />
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400 transition-colors">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Upload CSV file
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Drag and drop your `.csv` file here, or <span className="text-brand-700 dark:text-brand-400 font-semibold group-hover:underline">browse files</span>.
              </p>
            </label>

            {/* Or Paste Area */}
            <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-sm space-y-3">
              <label htmlFor="csv-paste" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Or paste CSV string content
              </label>
              <textarea
                id="csv-paste"
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  handleConvert(e.target.value);
                }}
                placeholder="id,category,question,option_1,option_2,answer,explanation&#10;1,Tax,Sample question,OptionA,OptionB,1,Explanation note"
                rows={6}
                className="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-ink-900 text-sm md:text-base font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-colors"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleConvert(csvText)}
                  className="flex-1 py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs md:text-sm transition-colors cursor-pointer btn"
                >
                  Convert & validate
                </button>
                <button
                  onClick={() => {
                    setCsvText('');
                    setErrors([]);
                    setSuccess(false);
                    setConvertedQuizJson('');
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs md:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer btn"
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs md:text-sm">
                <HelpCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>CSV column guide</span>
              </div>
              <button
                onClick={() => setShowExampleSchema(!showExampleSchema)}
                className="text-xs text-brand-700 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {showExampleSchema ? 'Hide example' : 'Show example'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              The first row must contain column headers. Standard columns: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">id</code> (optional), <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">category</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">question</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">option_1</code> to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">option_6</code> (minimum 2), <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">answer</code>, and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-700 dark:text-brand-400">explanation</code>.
            </p>

            {showExampleSchema && (
              <div className="bg-ink-900 text-slate-300 rounded-lg p-4 font-mono text-[10px] md:text-xs relative">
                <div className="flex justify-between items-center text-slate-500 pb-2 mb-2 border-b border-slate-800 font-sans font-semibold">
                  <span>Template CSV format</span>
                  <button
                    onClick={handleCopyCsv}
                    className="text-brand-300 hover:text-brand-200 hover:underline cursor-pointer"
                  >
                    {copiedState === 'csv' ? 'Copied' : 'Copy CSV'}
                  </button>
                </div>
                <pre className="overflow-x-auto max-h-[150px] leading-relaxed select-all">
                  {exampleCsvContent}
                </pre>
              </div>
            )}
          </section>
        </main>

        {/* Right Output Column (5 cols) */}
        <aside className="lg:col-span-5 space-y-6">
          
          {/* Validation Feedback Status Box */}
          {errors.length > 0 && (
            <div role="alert" className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-5 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h3>CSV mapping errors</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-rose-600 dark:text-rose-400 max-h-[150px] overflow-y-auto">
                {errors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-5 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <h3>Conversion success</h3>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                The CSV was parsed, validated, and successfully converted into a valid quiz JSON file.
              </p>
              
              {/* Direct Play CTA */}
              <button
                onClick={handlePlayQuizDirectly}
                className="w-full py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs md:text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors btn"
              >
                <Play className="h-4 w-4 fill-white" />
                Play converted quiz now
              </button>
            </div>
          )}

          {/* JSON preview */}
          {convertedQuizJson && (
            <section className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">
                  <Code className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span>JSON output preview</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 btn"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {copiedState === 'json' ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors btn"
                    aria-label="Download JSON file"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="bg-ink-950 text-slate-300 rounded-lg p-4 font-mono text-[10px] md:text-xs overflow-x-auto max-h-[300px] leading-relaxed">
                <pre>{convertedQuizJson}</pre>
              </div>
            </section>
          )}

        </aside>
      </div>

      {/* Pre-test Configuration Confirmation Modal */}
      <StartQuizModal
        isOpen={isConfigModalOpen}
        quiz={convertedQuizObj}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleConfirmStart}
      />
    </div>
  );
};
