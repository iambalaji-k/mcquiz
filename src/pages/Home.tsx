import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { parseAndValidateQuiz } from '../utils/validation';
import { 
  UploadCloud, 
  FileJson, 
  AlertCircle, 
  Download, 
  Play, 
  Sun, 
  Moon, 
  FileText,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  Globe
} from 'lucide-react';

export const Home: React.FC = () => {
  const { quiz, loadNewQuiz, discardQuiz, theme, toggleTheme } = useQuiz();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonExampleExpanded, setJsonExampleExpanded] = useState(false);

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
        loadNewQuiz(result.quiz);
        navigate('/quiz');
      } else {
        setErrors(result.errors);
      }
    };
    reader.onerror = () => {
      setErrors(['Failed to read the file. Please try again.']);
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
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        processFile(file);
      } else {
        setErrors(['Invalid file type. Please upload a .json file.']);
      }
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
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
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Play className="h-5 w-5 md:h-6 md:w-6 text-white fill-white translate-x-[1px]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-white dark:via-indigo-100 dark:to-indigo-300 bg-clip-text text-transparent font-outfit">
              MCQuiz
            </h1>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center gap-8">
        
        {/* Intro */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white font-outfit leading-tight">
            Prepare Smarter <br className="hidden md:block"/>
            <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Practice Offline
            </span>
          </h2>
        </section>

        {/* Resume Session Card (Conditional) */}
        {quiz && (
          <section className="bg-gradient-to-r from-indigo-500/10 to-violet-600/10 border border-indigo-200/50 dark:border-indigo-500/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                Active Session Detected
              </span>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {quiz.title}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                You have an incomplete attempt saved. Would you like to resume it?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/quiz')}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Play className="h-4 w-4 fill-white" />
                Resume Quiz
              </button>
              <button
                onClick={discardQuiz}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold text-sm transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Discard active quiz and upload a new one"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </section>
        )}

        {/* Upload Area */}
        <section className="w-full">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all duration-300 flex flex-col items-center justify-center group cursor-pointer relative min-h-[260px] ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-500/80 dark:border-slate-700 dark:hover:border-indigo-500/60 bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 dark:shadow-none'
            }`}
            onClick={triggerFilePicker}
            aria-label="Upload quiz JSON file"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && triggerFilePicker()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            
            <div className={`p-4 rounded-2xl mb-4 transition-transform duration-300 ${
              isDragging ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 scale-110' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-500'
            }`}>
              <UploadCloud className="h-8 w-8 md:h-10 md:w-10" />
            </div>

            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Load Quiz File
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              Drag & drop your quiz JSON file here, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">browse files</span>.
            </p>
          </div>
        </section>

        {/* Validation Errors Box */}
        {errors.length > 0 && (
          <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 md:p-6 space-y-3 animate-slide-up">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h3 className="text-sm md:text-base">File Validation Failed</h3>
            </div>
            <p className="text-xs md:text-sm text-red-700 dark:text-red-300">
              We found the following issues with your quiz file. Please fix them and try uploading again:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm text-red-600 dark:text-red-400 max-h-[200px] overflow-y-auto">
              {errors.map((error, idx) => (
                <li key={idx} className="leading-relaxed">{error}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Info & Schema / Download section */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {/* Download Sample */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <Download className="h-5 w-5 text-indigo-500" />
                <h4 className="text-sm md:text-base">Need a sample file?</h4>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Download a fully sample MCQ quiz file on capital gains under income tax to try it out.
              </p>
            </div>
            <a
              href="./sample-quiz.json"
              download="income-tax-quiz.json"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer active:scale-98 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FileText className="h-4 w-4" />
              Download Sample JSON
            </a>
          </div>

          {/* JSON Schema Guide */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <FileJson className="h-5 w-5 text-indigo-500" />
                <h4 className="text-sm md:text-base">JSON Schema Format</h4>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                JSON file must contain a title and an array of questions.
              </p>
            </div>
            
            <button
              onClick={() => setJsonExampleExpanded(!jsonExampleExpanded)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <HelpCircle className="h-4 w-4" />
              {jsonExampleExpanded ? 'Hide Schema Template' : 'View Schema Template'}
            </button>
          </div>

          {/* CSV to JSON Converter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                <h4 className="text-sm md:text-base">Convert Excel / CSV</h4>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Convert CSV data directly to validated JSON format.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/converter')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Open CSV Converter
            </button>
          </div>

          {/* GitHub Repo Quiz Explorer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <Globe className="h-5 w-5 text-indigo-500" />
                <h4 className="text-sm md:text-base">Browse readymade Quizzes</h4>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Browse exam sets, Select folders, preview questions, and practice offline.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Globe className="h-4 w-4" />
              Open Quiz Explorer
            </button>
          </div>
        </section>

        {/* Schema Modal/Code Box */}
        {jsonExampleExpanded && (
          <section className="bg-slate-900 text-slate-300 border border-slate-800 rounded-2xl p-5 font-mono text-xs md:text-sm relative overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3 text-slate-500 font-sans font-semibold">
              <span>Expected JSON Format</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sampleJsonSchema);
                  alert('JSON format schema copied to clipboard!');
                }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                Copy Code
              </button>
            </div>
            <pre className="overflow-x-auto max-h-[300px] leading-relaxed select-all">
              {sampleJsonSchema}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
};
