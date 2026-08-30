import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  ACTIVE_SESSION_KEY, 
  ACTIVE_QUIZ_KEY, 
  ACTIVE_PROGRESS_KEY, 
  THEME_KEY 
} from '../context/QuizContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    if (
      window.confirm(
        'This clears your saved quizzes, active sessions, progress, and theme preference. The app returns to a clean state. Proceed?'
      )
    ) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(ACTIVE_QUIZ_KEY);
      localStorage.removeItem(ACTIVE_PROGRESS_KEY);
      localStorage.removeItem(THEME_KEY);
      window.location.href = window.location.origin + window.location.pathname; // Redirects to clean home URL
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-50 dark:bg-ink-950 flex flex-col justify-center items-center px-4 py-12 text-center">
          <div className="max-w-md w-full bg-white dark:bg-ink-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xl space-y-6">
            
            {/* Warning Icon */}
            <div className="mx-auto h-16 w-16 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-9 w-9" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                An unexpected error occurred. It could be caused by a corrupt quiz file or saved session. Reloading usually fixes it.
              </p>
            </div>

            {/* Error Message Details (collapsed by default) */}
            {this.state.error && (
              <div className="bg-slate-50 dark:bg-ink-900 border border-slate-100 dark:border-slate-900 rounded-xl overflow-hidden text-left">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  aria-expanded={this.state.showDetails}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  Technical details
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {this.state.showDetails && (
                  <div className="px-4 pb-4 font-mono text-[11px] text-rose-700 dark:text-rose-400 overflow-x-auto">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                )}
              </div>
            )}

            {/* Actions Grid */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload web app
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-red-600 dark:text-red-400 font-bold text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Reset application data
              </button>
            </div>
            
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
