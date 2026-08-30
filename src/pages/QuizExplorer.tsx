import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { 
  fetchQuizTree, 
  fetchQuizJson, 
  clearGithubCache,
  filterTree
} from '../utils/githubService';
import type { QuizTreeNode } from '../utils/githubService';
import { validateQuiz } from '../utils/validation';
import type { Quiz } from '../types/quiz';
import { StartQuizModal } from '../components/StartQuizModal';
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
  Globe,
  ChevronRight,
  ChevronDown,
  X,
  FolderTree
} from 'lucide-react';

interface TreeNodeProps {
  node: QuizTreeNode;
  depth: number;
  expandedNodes: Record<string, boolean>;
  onToggle: (path: string) => void;
  selectedFile: QuizTreeNode | null;
  onSelectFile: (file: QuizTreeNode) => void;
  searchTerm: string;
}

const TreeNodeItem: React.FC<TreeNodeProps> = ({
  node,
  depth,
  expandedNodes,
  onToggle,
  selectedFile,
  onSelectFile,
  searchTerm,
}) => {
  const isExpanded = !!expandedNodes[node.id];
  const isFile = node.type === 'file';
  const isSelected = isFile && selectedFile?.id === node.id;

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isFile) {
    return (
      <button
        onClick={() => onSelectFile(node)}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-left cursor-pointer transition-all duration-150 focus:outline-none ${
          isSelected
            ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-bold'
            : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
        }`}
        style={{ marginLeft: depth > 0 ? `${depth * 14}px` : undefined }}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <FileJson className={`h-4 w-4 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
          <span className="text-xs md:text-sm truncate">
            {node.name}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
          {formatBytes(node.size)}
        </span>
      </button>
    );
  }

  // Directory Node
  const children = node.children || [];
  const quizzesCount = node.totalQuizzesCount || 0;

  return (
    <div className="space-y-1">
      {/* Folder Header Row */}
      <button
        onClick={() => onToggle(node.id)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left font-semibold text-xs md:text-sm cursor-pointer focus:outline-none ${
          isExpanded
            ? 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            : 'bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
        }`}
        style={{ marginLeft: depth > 0 ? `${depth * 14}px` : undefined }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-indigo-500 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          )}

          {isExpanded ? (
            <FolderOpen className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
          ) : (
            <Folder className="h-4.5 w-4.5 text-indigo-500/80 shrink-0" />
          )}

          <span className="font-bold tracking-tight font-outfit truncate">
            {node.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-bold">
            {quizzesCount} {quizzesCount === 1 ? 'quiz' : 'quizzes'}
          </span>
        </div>
      </button>

      {/* Recursive Sub-tree */}
      {isExpanded && children.length > 0 && (
        <div 
          className="space-y-1 pt-1 pb-1 pl-2.5 border-l-2 border-slate-200/80 dark:border-slate-800"
          style={{ marginLeft: depth > 0 ? `${depth * 14 + 10}px` : '10px' }}
        >
          {children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const QuizExplorer: React.FC = () => {
  const { loadNewQuiz, theme, toggleTheme } = useQuiz();
  const navigate = useNavigate();

  // Root Tree State
  const [rootNodes, setRootNodes] = useState<QuizTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [explorerError, setExplorerError] = useState<string | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Quiz State
  const [selectedFile, setSelectedFile] = useState<QuizTreeNode | null>(null);
  const [loadingQuizContent, setLoadingQuizContent] = useState(false);
  const [quizPreviewData, setQuizPreviewData] = useState<Quiz | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Collect all folder IDs to support Expand All / Collapse All
  const getAllFolderIds = useCallback((nodes: QuizTreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: QuizTreeNode[]) => {
      for (const node of nodeList) {
        if (node.type === 'dir') {
          ids.push(node.id);
          if (node.children) traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  }, []);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // 1. Initial / Refresh Load of Tree
  const loadTree = useCallback(async (forceRefresh = false) => {
    setExplorerError(null);
    setLoading(true);
    if (forceRefresh) {
      clearGithubCache();
      setSelectedFile(null);
      setQuizPreviewData(null);
      setPreviewErrors([]);
    }

    try {
      const tree = await fetchQuizTree(forceRefresh);
      setRootNodes(tree);

      // Auto-expand top level folders by default on fresh load
      if (!forceRefresh) {
        setExpandedNodes(prev => {
          if (Object.keys(prev).length > 0) return prev;
          const initialExpanded: Record<string, boolean> = {};
          tree.forEach(node => {
            if (node.type === 'dir') {
              initialExpanded[node.id] = true;
            }
          });
          return initialExpanded;
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to the GitHub repository.';
      setExplorerError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchQuizTree(false)
      .then((tree) => {
        if (!isMounted) return;
        setRootNodes(tree);
        setExpandedNodes((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const initialExpanded: Record<string, boolean> = {};
          tree.forEach((node) => {
            if (node.type === 'dir') {
              initialExpanded[node.id] = true;
            }
          });
          return initialExpanded;
        });
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to connect to the GitHub repository.';
        setExplorerError(message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Toggle Folder Node
  const handleToggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // 3. Expand / Collapse All
  const handleToggleAll = (expand: boolean) => {
    if (!expand) {
      setExpandedNodes({});
      return;
    }
    const allIds = getAllFolderIds(rootNodes);
    const newExpanded: Record<string, boolean> = {};
    allIds.forEach(id => {
      newExpanded[id] = true;
    });
    setExpandedNodes(newExpanded);
  };

  // 4. Select file and fetch JSON content for preview with AbortController
  const handleSelectFile = async (file: QuizTreeNode) => {
    if (selectedFile?.id === file.id) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSelectedFile(file);
    setLoadingQuizContent(true);
    setQuizPreviewData(null);
    setPreviewErrors([]);

    try {
      if (!file.downloadUrl) {
        throw new Error('This file has no downloadable raw URL.');
      }
      const rawQuiz = await fetchQuizJson(file.downloadUrl);
      
      // Check if another request was started
      if (abortControllerRef.current !== controller) return;

      // Validate schema
      const validation = validateQuiz(rawQuiz);
      if (validation.isValid) {
        setQuizPreviewData(rawQuiz as Quiz);
      } else {
        setPreviewErrors(validation.errors);
      }
    } catch (err: unknown) {
      if (abortControllerRef.current !== controller) return;
      const message = err instanceof Error ? err.message : 'Failed to download or parse quiz file JSON contents.';
      setPreviewErrors([message]);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoadingQuizContent(false);
      }
    }
  };

  // 5. Open question configuration modal before starting
  const handleStartPlay = () => {
    if (quizPreviewData) {
      setIsConfigModalOpen(true);
    }
  };

  // 6. Confirmed from modal -> load & start test
  const handleConfirmStart = (preparedQuiz: Quiz) => {
    loadNewQuiz(preparedQuiz);
    setIsConfigModalOpen(false);
    navigate('/quiz');
  };

  // 7. Search filtering & auto-expanding matching branches
  const { filteredTreeNodes, matchedCount, matchingPaths } = useMemo(() => {
    const result = filterTree(rootNodes, searchTerm);
    return {
      filteredTreeNodes: result.filtered,
      matchedCount: result.matchedCount,
      matchingPaths: result.matchingPaths,
    };
  }, [rootNodes, searchTerm]);

  // Derive expanded nodes without render-phase side effects
  const effectiveExpandedNodes = useMemo(() => {
    if (!searchTerm.trim() || matchingPaths.size === 0) {
      return expandedNodes;
    }
    const merged = { ...expandedNodes };
    matchingPaths.forEach(path => {
      merged[path] = true;
    });
    return merged;
  }, [expandedNodes, searchTerm, matchingPaths]);

  // Breadcrumbs calculation for selected file
  const breadcrumbSegments = useMemo(() => {
    if (!selectedFile) return [];
    return selectedFile.path.split('/').filter(Boolean);
  }, [selectedFile]);

  // Formatter for file size
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Total count of all available quizzes across all directories
  const totalRepositoryQuizzes = useMemo(() => {
    return rootNodes.reduce((acc, node) => {
      if (node.type === 'file') return acc + 1;
      return acc + (node.totalQuizzesCount || 0);
    }, 0);
  }, [rootNodes]);

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

        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-indigo-500" />
          <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white font-outfit">
            Browse Repository Quizzes
          </h1>
        </div>

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
        
        {/* Left Side: Multi-level Tree Explorer (7 cols) */}
        <main className="lg:col-span-7 space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
            
            {/* Header controls inside explorer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm md:text-base font-outfit">
                <Globe className="h-5 w-5 text-indigo-500" />
                <h2>Repository Hierarchy</h2>
                {totalRepositoryQuizzes > 0 && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40 font-bold">
                    {totalRepositoryQuizzes} total
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAll(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Expand all nested folders"
                >
                  Expand All
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => handleToggleAll(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Collapse all folders"
                >
                  Collapse All
                </button>
                <button
                  onClick={() => loadTree(true)}
                  disabled={loading}
                  aria-label="Refresh Directory"
                  className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh from GitHub"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search Input bar */}
            <div className="relative">
              <label htmlFor="explorer-search" className="sr-only">Search nested files and folders</label>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="explorer-search"
                type="text"
                placeholder="Search folders, sub-folders, or quiz files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs md:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search query"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search results summary */}
            {searchTerm.trim() && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-semibold">
                <span>Filtering by: <strong className="text-slate-800 dark:text-slate-200 font-bold">"{searchTerm}"</strong></span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{matchedCount} {matchedCount === 1 ? 'quiz file match' : 'quiz files matched'}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && rootNodes.length === 0 && (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-11 w-full bg-slate-100 dark:bg-slate-800/60 animate-pulse rounded-xl"></div>
                ))}
              </div>
            )}

            {/* Explorer Level Error */}
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
                  onClick={() => loadTree(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Empty Tree State */}
            {!loading && !explorerError && filteredTreeNodes.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs md:text-sm space-y-2">
                <p>No matching questionnaires found.</p>
                <p className="text-[11px]">Ensure there are valid <code className="font-mono text-slate-600 dark:text-slate-400">.json</code> files inside the <code className="font-mono text-slate-600 dark:text-slate-400">questions/</code> folder on GitHub.</p>
              </div>
            )}

            {/* Multi-level Tree Hierarchy Rendering */}
            {!explorerError && filteredTreeNodes.length > 0 && (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {filteredTreeNodes.map((node) => (
                  <TreeNodeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedNodes={effectiveExpandedNodes}
                    onToggle={handleToggleNode}
                    selectedFile={selectedFile}
                    onSelectFile={handleSelectFile}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Right Side: Quiz Info Preview & Play Panel (5 cols) */}
        <aside className="lg:col-span-5">
          
          {/* Default view when no file is selected */}
          {!selectedFile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm min-h-[340px] flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-full text-slate-400 dark:text-slate-600">
                <HelpCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200">
                  Select a Quiz Set
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Expand any folder or sub-folder in the hierarchy on the left and choose a quiz to inspect and practice.
                </p>
              </div>
            </div>
          )}

          {/* Preview view for loaded quiz info */}
          {selectedFile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="space-y-4">
                
                {/* Header info in right preview panel */}
                <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                    <FolderTree className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    {breadcrumbSegments.map((segment, idx) => (
                      <React.Fragment key={idx}>
                        <span className="truncate max-w-[120px] font-medium">{segment}</span>
                        {idx < breadcrumbSegments.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white font-outfit break-words">
                    {selectedFile.name}
                  </h3>

                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                        {(() => {
                          const distinctCategories = Array.from(new Set(quizPreviewData.questions.map((q) => q.category)));
                          return (
                            <span 
                              className="text-xs font-black text-slate-800 dark:text-white font-outfit truncate block" 
                              title={distinctCategories.join(', ')}
                            >
                              {distinctCategories.length} {distinctCategories.length === 1 ? 'Topic' : 'Topics'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Offline support tip */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-start gap-2.5">
                      <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        Once started, the questions are cached in your local session so you can complete the attempt even without internet.
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
            </div>
          )}
        </aside>
      </div>

      {/* Pre-test Configuration Confirmation Modal */}
      <StartQuizModal
        isOpen={isConfigModalOpen}
        quiz={quizPreviewData}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleConfirmStart}
      />
    </div>
  );
};


