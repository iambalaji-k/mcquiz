import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { QuizPlayer } from './pages/QuizPlayer';
import { ResultSummary } from './pages/ResultSummary';
import { CsvConverter } from './pages/CsvConverter';
import { useQuiz } from './hooks/useQuiz';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppRoutes() {
  const { quiz, isCompleted } = useQuiz();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/converter" element={<CsvConverter />} />
      
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
