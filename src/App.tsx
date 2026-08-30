import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Home } from './pages/Home';
import { QuizPlayer } from './pages/QuizPlayer';
import { ResultSummary } from './pages/ResultSummary';
import { CsvConverter } from './pages/CsvConverter';
import { QuizExplorer } from './pages/QuizExplorer';
import { useQuiz } from './hooks/useQuiz';
import { ErrorBoundary } from './components/ErrorBoundary';

const TITLES: Record<string, string> = {
  '/': 'MCQuiz — Offline MCQ Practice',
  '/quiz': 'Attempt · MCQuiz',
  '/result': 'Results · MCQuiz',
  '/explore': 'Browse Quizzes · MCQuiz',
  '/converter': 'CSV to JSON Converter · MCQuiz',
};

// On client-side navigation the page never reloads, so retitle the document
// and move focus to the new view's h1 (made focusable via tabindex="-1").
function usePageAnnounce() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? TITLES['/'];
    const heading = mainRef.current?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    } else {
      mainRef.current?.focus();
    }
  }, [location.pathname]);

  return mainRef;
}

function AppRoutes() {
  const { quiz, isCompleted } = useQuiz();
  const mainRef = usePageAnnounce();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/converter" element={<CsvConverter />} />
          <Route path="/explore" element={<QuizExplorer />} />
          
          <Route 
            path="/quiz" 
            element={
              quiz ? (
                isCompleted ? (
                  <Navigate to="/result" replace />
                ) : (
                  <QuizPlayer />
                )
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route 
            path="/result" 
            element={
              quiz ? (
                isCompleted ? (
                  <ResultSummary />
                ) : (
                  <Navigate to="/quiz" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
