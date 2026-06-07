import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { parseCSV, convertCsvToQuiz } from '../utils/csvConverter';
import { validateQuiz } from '../utils/validation';
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
  const [isDragging, setIsDragging] = useState(false);
  const [showExampleSchema, setShowExampleSchema] = useState(false);
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        processFile(file);
      } else {
        setErrors(['Invalid file type. Please upload a .csv file.']);
      }
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCopyJson = () => {
    if (convertedQuizJson) {
      navigator.clipboard.writeText(convertedQuizJson);
      alert('JSON copied to clipboard!');
    }
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
    if (!convertedQuizJson) return;
    const parsedQuiz = JSON.parse(convertedQuizJson);
    loadNewQuiz(parsedQuiz);
    navigate('/quiz');
  };

  const exampleCsvContent = `id,category,question,option_1,option_2,option_3,option_4,answer,explanation
1,Income Tax,Exemption limit for senior citizens?,"250,000","300,000","500,000","600,000",2,Senior citizen exemption limit is 300,000.
2,Deductions,Under which section is medical insurance premium deductible?,"Section 80C","Section 80D","Section 80E",,2,Section 80D covers health insurance premiums.`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>

        <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white font-outfit">
          CSV to JSON Converter
        </h1>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Options and Input Column (7 cols) */}
        <main className="lg:col-span-7 space-y-6">
          
          {/* Metadata settings Card */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white font-outfit">
              1. Quiz Metadata Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="quiz-title">Quiz Title</label>
                <input
                  id="quiz-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Income Tax Exam Set"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="quiz-desc">Quiz Description</label>
                <input
                  id="quiz-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Practice questions on deductions"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400" htmlFor="answer-format">Answer Indexing Format</label>
                <select
                  id="answer-format"
                  value={answerIndexing}
                  onChange={(e) => setAnswerIndexing(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
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
                  className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* CSV File Input Selector */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              2. Load CSV Source Data
            </h2>

            {/* Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFilePicker}
              className={`border-2 border-dashed rounded-3xl p-6 md:p-8 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
                  : 'border-slate-200 hover:border-indigo-500 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-500 transition-all">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Upload CSV File
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Drag & drop your `.csv` file here, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">browse files</span>.
              </p>
            </div>

            {/* Or Paste Area */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-3">
              <label htmlFor="csv-paste" className="block text-xs font-bold text-slate-800 dark:text-slate-200 font-outfit">
                Or Paste CSV String Content
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
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleConvert(csvText)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs md:text-sm transition-all cursor-pointer active:scale-98"
                >
                  Convert & Validate
                </button>
                <button
                  onClick={() => {
                    setCsvText('');
                    setErrors([]);
                    setSuccess(false);
                    setConvertedQuizJson('');
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs md:text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs md:text-sm">
                <HelpCircle className="h-4 w-4 text-indigo-500" />
                <span>CSV Column Guide</span>
              </div>
              <button
                onClick={() => setShowExampleSchema(!showExampleSchema)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showExampleSchema ? 'Hide Example' : 'Show Example'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              The first row must contain column headers. Standard columns: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">id</code> (optional), <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">category</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">question</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">option_1</code> to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">option_6</code> (minimum 2), <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">answer</code>, and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">explanation</code>.
            </p>

            {showExampleSchema && (
              <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-[10px] md:text-xs relative">
                <div className="flex justify-between items-center text-slate-500 pb-2 mb-2 border-b border-slate-800 font-sans font-semibold">
                  <span>Template CSV Format</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exampleCsvContent);
                      alert('Example CSV copied!');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Copy CSV
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
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl p-5 md:p-6 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h3>CSV Mapping Errors</h3>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-rose-600 dark:text-rose-400 max-h-[150px] overflow-y-auto">
                {errors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">{err}</li>
                ))}
              </ul>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-3xl p-5 md:p-6 space-y-3 animate-slide-up">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <h3>Conversion Success!</h3>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                The CSV was parsed, validated, and successfully converted into a valid quiz JSON file.
              </p>
              
              {/* Direct Play CTA */}
              <button
                onClick={handlePlayQuizDirectly}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 focus:outline-none"
              >
                <Play className="h-4.5 w-4.5 fill-white" />
                Play Converted Quiz Now
              </button>
            </div>
          )}

          {/* JSON preview */}
          {convertedQuizJson && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">
                  <Code className="h-4 w-4 text-indigo-500" />
                  <span>JSON Output Preview</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-all active:scale-95"
                    title="Copy JSON to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-all active:scale-95"
                    title="Download JSON file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-300 rounded-xl p-4 font-mono text-[10px] md:text-xs overflow-x-auto max-h-[300px] leading-relaxed">
                <pre>{convertedQuizJson}</pre>
              </div>
            </section>
          )}

        </aside>
      </div>
    </div>
  );
};
