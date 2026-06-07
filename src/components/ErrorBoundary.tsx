import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
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
        'This will clear all active sessions and themes, resetting the application to its default state. Proceed?'
      )
    ) {
      localStorage.removeItem('quiz-app-active-session');
      localStorage.removeItem('quiz-app-theme');
      window.location.href = window.location.origin + window.location.pathname; // Redirects to clean home URL
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
            
            {/* Warning Icon */}
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-9 w-9" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-outfit">
                Something went wrong
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                An unexpected error occurred in the application. This could be due to a corrupt data model or active session cache.
              </p>
            </div>

            {/* Error Message Details (if available) */}
            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 text-left font-mono text-[11px] text-rose-700 dark:text-rose-400 overflow-x-auto max-h-[120px]">
                <strong className="block font-sans font-bold text-slate-600 dark:text-slate-400 mb-1">Error Message:</strong>
                {this.state.error.name}: {this.state.error.message}
              </div>
            )}

            {/* Actions Grid */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 focus:outline-none"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Web App
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-red-600 dark:text-red-400 font-bold text-sm cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 focus:outline-none"
              >
                <Trash2 className="h-4 w-4" />
                Reset Application Data
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
