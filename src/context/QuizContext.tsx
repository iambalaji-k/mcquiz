import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Quiz } from '../types/quiz';
import {
  QuizContext,
  type QuizContextType,
  ACTIVE_SESSION_KEY,
  ACTIVE_QUIZ_KEY,
  ACTIVE_PROGRESS_KEY,
  THEME_KEY,
} from './QuizContextTypes';

export {
  QuizContext,
  ACTIVE_SESSION_KEY,
  ACTIVE_QUIZ_KEY,
  ACTIVE_PROGRESS_KEY,
  THEME_KEY,
};
export type { QuizContextType };

interface ProgressState {
  currentQuestionIndex: number;
  answers: Record<string | number, number>;
  score: number;
  timeSpent: number;
  isCompleted: boolean;
}

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme State Initialization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply class to html/document element when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // 2. Initialize Quiz & Progress State with Migration Support
  const [quiz, setQuiz] = useState<Quiz | null>(() => {
    try {
      // Check new separated key first
      const savedQuiz = localStorage.getItem(ACTIVE_QUIZ_KEY);
      if (savedQuiz) {
        return JSON.parse(savedQuiz);
      }
      // Check legacy session key
      const legacySession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (legacySession) {
        const parsed = JSON.parse(legacySession);
        if (parsed?.quiz) return parsed.quiz;
      }
    } catch (e) {
      console.error('Failed to load active quiz from LocalStorage', e);
    }
    return null;
  });

  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      // Check new separated progress key first
      const savedProgress = localStorage.getItem(ACTIVE_PROGRESS_KEY);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        return {
          currentQuestionIndex: parsed.currentQuestionIndex ?? 0,
          answers: parsed.answers ?? {},
          score: parsed.score ?? 0,
          timeSpent: parsed.timeSpent ?? 0,
          isCompleted: parsed.isCompleted ?? false,
        };
      }
      // Check legacy session key
      const legacySession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (legacySession) {
        const parsed = JSON.parse(legacySession);
        if (parsed) {
          return {
            currentQuestionIndex: parsed.currentQuestionIndex ?? 0,
            answers: parsed.answers ?? {},
            score: parsed.score ?? 0,
            timeSpent: parsed.timeSpent ?? 0,
            isCompleted: parsed.isCompleted ?? false,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load active progress from LocalStorage', e);
    }
    return {
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    };
  });

  // Keep latest progress in ref for throttled/unload saving
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const saveProgress = useCallback((state: ProgressState) => {
    try {
      localStorage.setItem(ACTIVE_PROGRESS_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  }, []);

  // 3. Timer Effect (Increments timeSpent without serializing the whole quiz)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (quiz && !progress.isCompleted) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          timeSpent: prev.timeSpent + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quiz, progress.isCompleted]);

  // Periodic autosave of progress every 10s and on beforeunload
  useEffect(() => {
    const interval = setInterval(() => {
      if (quiz && !progressRef.current.isCompleted) {
        saveProgress(progressRef.current);
      }
    }, 10000);

    const handleBeforeUnload = () => {
      if (quiz) {
        saveProgress(progressRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [quiz, saveProgress]);

  // 4. Actions
  const loadNewQuiz = useCallback((newQuiz: Quiz) => {
    const initialProgress: ProgressState = {
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    };
    setQuiz(newQuiz);
    setProgress(initialProgress);
    try {
      localStorage.setItem(ACTIVE_QUIZ_KEY, JSON.stringify(newQuiz));
      localStorage.setItem(ACTIVE_PROGRESS_KEY, JSON.stringify(initialProgress));
      localStorage.removeItem(ACTIVE_SESSION_KEY); // Clean up legacy key
    } catch (e) {
      console.error('Failed to persist new quiz', e);
    }
  }, []);

  const answerQuestion = useCallback((questionId: string | number, optionIndex: number) => {
    if (!quiz) return;
    setProgress((prev) => {
      if (prev.answers[questionId] !== undefined) return prev;
      const currentQuestion = quiz.questions.find((q) => q.id === questionId || String(q.id) === String(questionId));
      if (!currentQuestion) return prev;

      const isCorrect = currentQuestion.answer === optionIndex;
      const updated: ProgressState = {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: optionIndex,
        },
        score: isCorrect ? prev.score + 1 : prev.score,
      };
      saveProgress(updated);
      return updated;
    });
  }, [quiz, saveProgress]);

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    setProgress((prev) => {
      const nextIndex = Math.min(prev.currentQuestionIndex + 1, quiz.questions.length - 1);
      const updated: ProgressState = { ...prev, currentQuestionIndex: nextIndex };
      saveProgress(updated);
      return updated;
    });
  }, [quiz, saveProgress]);

  const prevQuestion = useCallback(() => {
    if (!quiz) return;
    setProgress((prev) => {
      const prevIndex = Math.max(prev.currentQuestionIndex - 1, 0);
      const updated: ProgressState = { ...prev, currentQuestionIndex: prevIndex };
      saveProgress(updated);
      return updated;
    });
  }, [quiz, saveProgress]);

  const jumpToQuestion = useCallback((index: number) => {
    if (!quiz) return;
    setProgress((prev) => {
      const targetIndex = Math.max(0, Math.min(index, quiz.questions.length - 1));
      const updated: ProgressState = { ...prev, currentQuestionIndex: targetIndex };
      saveProgress(updated);
      return updated;
    });
  }, [quiz, saveProgress]);

  const completeQuiz = useCallback(() => {
    setProgress((prev) => {
      const updated: ProgressState = { ...prev, isCompleted: true };
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  const discardQuiz = useCallback(() => {
    localStorage.removeItem(ACTIVE_QUIZ_KEY);
    localStorage.removeItem(ACTIVE_PROGRESS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setQuiz(null);
    setProgress({
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    });
  }, []);

  const value = useMemo<QuizContextType>(() => ({
    quiz,
    currentQuestionIndex: progress.currentQuestionIndex,
    answers: progress.answers,
    score: progress.score,
    timeSpent: progress.timeSpent,
    isCompleted: progress.isCompleted,
    loadNewQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    completeQuiz,
    discardQuiz,
    theme,
    toggleTheme,
  }), [
    quiz,
    progress.currentQuestionIndex,
    progress.answers,
    progress.score,
    progress.timeSpent,
    progress.isCompleted,
    loadNewQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    completeQuiz,
    discardQuiz,
    theme,
    toggleTheme,
  ]);

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};
