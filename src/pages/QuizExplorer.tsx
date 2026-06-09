import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { 
  fetchRootFolders, 
  fetchFolderFiles, 
  fetchQuizJson, 
  clearGithubCache
} from '../utils/githubService';
import type { GitHubContentItem } from '../utils/githubService';
import { validateQuiz } from '../utils/validation';
import type { Quiz } from '../types/quiz';
import { 
  ArrowLeft, 
  Search, 
  Folder, 
  FolderOpen, 
  FileJson, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Sun,
  Moon,
  HelpCircle,
  Globe
} from 'lucide-react';

export const QuizExplorer: React.FC = () => {
  const { loadNewQuiz, theme, toggleTheme } = useQuiz();
  const navigate = useNavigate();

  // Directory Catalog State
  const [folders, setFolders] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [folderFiles, setFolderFiles] = useState<Record<string, GitHubContentItem[]>>({});
  
  // Loading & Error States
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [explorerError, setExplorerError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Quiz Preview State
  const [selectedFile, setSelectedFile] = useState<GitHubContentItem | null>(null);
  const [loadingQuizContent, setLoadingQuizContent] = useState(false);
  const [quizPreviewData, setQuizPreviewData] = useState<Quiz | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);

  // 1. Initial Load of Root folders
  const loadRootCatalog = async (forceRefresh = false) => {
    setExplorerError(null);
    setLoadingFolders(true);
    if (forceRefresh) {
      clearGithubCache();
      setFolderFiles({});
      setExpandedFolders({});
      setSelectedFile(null);
      setQuizPreviewData(null);
      setPreviewErrors([]);
    }

    try {
      const rootFolders = await fetchRootFolders(forceRefresh);
      setFolders(rootFolders);
    } catch (err: any) {
      setExplorerError(err.message || 'Failed to connect to the GitHub repository.');
    } finally {
      setLoadingFolders(false);
    }
  };

  useEffect(() => {
    loadRootCatalog();
  }, []);

  // 2. Toggle Folder Expansion and fetch sub-files lazily
  const handleToggleFolder = async (folderName: string) => {
    const isCurrentlyExpanded = !!expandedFolders[folderName];
    
    // Toggle state first
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !isCurrentlyExpanded
    }));

    // If expanding and don't have files yet, fetch them
    if (!isCurrentlyExpanded && !folderFiles[folderName]) {
      setLoadingFiles(prev => ({ ...prev, [folderName]: true }));
      try {
        const files = await fetchFolderFiles(folderName);
        setFolderFiles(prev => ({
          ...prev,
          [folderName]: files
        }));
      } catch (err: any) {
        console.error(`Error loading files for folder ${folderName}:`, err);
        // Alert error context but keep folder open
      } finally {
        setLoadingFiles(prev => ({ ...prev, [folderName]: false }));
      }
    }
  };

  // 3. Select file and fetch JSON content for preview
  const handleSelectFile = async (file: GitHubContentItem) => {
    if (selectedFile?.sha === file.sha) return;
    
    setSelectedFile(file);
    setLoadingQuizContent(true);
    setQuizPreviewData(null);
    setPreviewErrors([]);

    try {
      if (!file.download_url) {
        throw new Error('This file has no downloadable URL.');
      }
      const rawQuiz = await fetchQuizJson(file.download_url);
      
      // Validate schema
      const validation = validateQuiz(rawQuiz);
      if (validation.isValid) {
        setQuizPreviewData(rawQuiz as Quiz);
      } else {
        setPreviewErrors(validation.errors);
      }
    } catch (err: any) {
      setPreviewErrors([err.message || 'Failed to download or parse quiz file JSON contents.']);
    } finally {
      setLoadingQuizContent(false);
    }
  };

  // 4. Start playing the selected quiz
  const handleStartPlay = () => {
    if (quizPreviewData) {
      loadNewQuiz(quizPreviewData);
      navigate('/quiz');
    }
  };

  // 5. Search filtering (filter folders and files)
  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folders;

    const term = searchTerm.toLowerCase();
    return folders.filter(folder => {
      // Matches folder name
      if (folder.toLowerCase().includes(term)) return true;
      
      // Matches any files inside this folder
      const files = folderFiles[folder];
      if (files && files.some(file => file.name.toLowerCase().includes(term))) {
        return true;
      }
      return false;
    });
  }, [folders, folderFiles, searchTerm]);

  // Formatter for file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
      {/* Page Header */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>

        <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white font-outfit">
          Browse Repository Quizzes
        </h1>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm focus:outline-none"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* Left Side: Tree File Explorer (7 cols) */}
        <main className="lg:col-span-7 space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            
            {/* Header controls inside explorer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base font-outfit">
                <Globe className="h-5 w-5 text-indigo-500" />
                <h2>GitHub Folder Contents</h2>
              </div>
              <button
                onClick={() => loadRootCatalog(true)}
                disabled={loadingFolders}
                className="self-start sm:self-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingFolders ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Search Input bar */}
            <div className="relative">
              <label htmlFor="explorer-search" className="sr-only">Search remote files</label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="explorer-search"
                type="text"
                placeholder="Search folders or quiz sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Loading Indicator for Root list */}
            {loadingFolders && folders.length === 0 && (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                ))}
              </div>
            )}

            {/* General Explorer Level Error */}
            {explorerError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <h3>Connection Error</h3>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-semibold">
                  {explorerError}
                </p>
                <button
                  onClick={() => loadRootCatalog()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Empty Catalog State */}
            {!loadingFolders && !explorerError && filteredFolders.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                No items found. Ensure there are subfolders in `/questions/` on the remote repository.
              </div>
            )}

            {/* Folders tree list */}
            {!explorerError && filteredFolders.length > 0 && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredFolders.map((folder) => {
                  const isExpanded = !!expandedFolders[folder];
                  const files = folderFiles[folder] || [];
                  const isLoadingFiles = !!loadingFiles[folder];

                  // Filter files based on search term
                  const filteredFiles = files.filter(file => 
                    file.name.toLowerCase().includes(searchTerm.toLowerCase())
                  );

                  return (
                    <div key={folder} className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
                      
                      {/* Folder Item Header */}
                      <button
                        onClick={() => handleToggleFolder(folder)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-left font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          {isExpanded ? (
                            <FolderOpen className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                          ) : (
                            <Folder className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                          )}
                          <span className="font-bold tracking-tight font-outfit">{folder}</span>
                        </div>
                        {files.length > 0 && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                            {files.length} {files.length === 1 ? 'file' : 'files'}
                          </span>
                        )}
                      </button>

                      {/* Sub-Files List */}
                      {isExpanded && (
                        <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/40 space-y-1.5 animate-slide-down">
                          
                          {/* Folder Files Loading skeleton */}
                          {isLoadingFiles && (
                            <div className="space-y-2 py-1">
                              <div className="h-9 w-full bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-lg"></div>
                              <div className="h-9 w-full bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-lg"></div>
                            </div>
                          )}

                          {/* Empty subfolder */}
                          {!isLoadingFiles && files.length === 0 && (
                            <div className="text-center py-4 text-[11px] text-slate-400 dark:text-slate-500">
                              No JSON question sets found inside this folder.
                            </div>
                          )}

                          {/* Filtered files list */}
                          {!isLoadingFiles && files.length > 0 && filteredFiles.map((file) => {
                            const isSelected = selectedFile?.sha === file.sha;
                            return (
                              <button
                                key={file.sha}
                                onClick={() => handleSelectFile(file)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all focus:outline-none ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500/10'
                                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-850 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileJson className={`h-4 w-4 shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-600'}`} />
                                  <span className="text-xs md:text-sm font-semibold truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                  {formatBytes(file.size)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* Right Side: Quiz Info Preview & Play Panel (5 cols) */}
        <aside className="lg:col-span-5">
          
          {/* Default view when no file is selected */}
          {!selectedFile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-full text-slate-400 dark:text-slate-600">
                <HelpCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200">
                  Select a Quiz Set
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Choose any questionnaire JSON file on the left side to preview its contents and start the practice test.
                </p>
              </div>
            </div>
          )}

          {/* Preview view for loaded quiz info */}
          {selectedFile && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 min-h-[300px] flex flex-col justify-between animate-fade-in">
              <div className="space-y-4">
                
                {/* Meta details */}
                <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
                    File details
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Path: {selectedFile.path.split('/').slice(0, -1).join('/')}</span>
                    <span>•</span>
                    <span>Size: {formatBytes(selectedFile.size)}</span>
                  </div>
                </div>

                {/* Loading state for individual quiz parsing */}
                {loadingQuizContent && (
                  <div className="space-y-4 py-8 text-center">
                    <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Downloading and verifying quiz contents...</p>
                  </div>
                )}

                {/* Quiz schema errors box */}
                {previewErrors.length > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <h3>Validation Failed</h3>
                    </div>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      The file downloaded successfully but is not valid. The following issues were found:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-rose-600 dark:text-rose-400 max-h-[150px] overflow-y-auto">
                      {previewErrors.map((err, idx) => (
                        <li key={idx} className="leading-relaxed">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Loaded Preview details block */}
                {!loadingQuizContent && quizPreviewData && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Quiz Title
                      </h4>
                      <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white font-outfit leading-snug">
                        {quizPreviewData.title}
                      </h3>
                    </div>

                    {quizPreviewData.description && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                          Description
                        </h4>
                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                          {quizPreviewData.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Questions
                        </span>
                        <span className="text-base font-black text-slate-800 dark:text-white font-outfit">
                          {quizPreviewData.questions.length} Sets
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900/60">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Categories
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-white font-outfit truncate block" title={quizPreviewData.questions[0]?.category}>
                          {quizPreviewData.questions[0]?.category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Offline support tip */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-start gap-2.5">
                      <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        Once started, the quiz questions will be cached in your local session cache, allowing you to practice even without an internet connection.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Quiz Action Footer */}
              {!loadingQuizContent && quizPreviewData && (
                <button
                  onClick={handleStartPlay}
                  className="w-full mt-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 flex items-center justify-center gap-2 focus:outline-none transition-all"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Start Practice Attempt</span>
                </button>
              )}
            </section>
          )}
        </aside>

      </div>
    </div>
  );
};
