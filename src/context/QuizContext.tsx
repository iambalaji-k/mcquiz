import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import type { Quiz, QuizState } from '../types/quiz';

interface QuizContextType {
  // Quiz State
  quiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string | number, number>;
  score: number;
  timeSpent: number;
  isCompleted: boolean;
  
  // Actions
  loadNewQuiz: (quiz: Quiz) => void;
  answerQuestion: (questionId: string | number, optionIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  completeQuiz: () => void;
  discardQuiz: () => void;
  
  // Theme State & Actions
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const ACTIVE_SESSION_KEY = 'quiz-app-active-session';
const THEME_KEY = 'quiz-app-theme';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme State Initialization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2. Quiz Session State Initialization from LocalStorage
  const [session, setSession] = useState<QuizState>(() => {
    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        // Make sure it matches our QuizState structure
        if (parsed && typeof parsed === 'object' && parsed.quiz) {
          return {
            quiz: parsed.quiz,
            currentQuestionIndex: parsed.currentQuestionIndex ?? 0,
            answers: parsed.answers ?? {},
            score: parsed.score ?? 0,
            timeSpent: parsed.timeSpent ?? 0,
            isCompleted: parsed.isCompleted ?? false,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load active session from LocalStorage', e);
    }
    return {
      quiz: null,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    };
  });

  // 3. Timer Effect
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Only count up if a quiz is loaded and not yet completed
    if (session.quiz && !session.isCompleted) {
      timerRef.current = setInterval(() => {
        setSession((prev) => {
          const updated = { ...prev, timeSpent: prev.timeSpent + 1 };
          // Autosave on timer tick
          localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updated));
          return updated;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session.quiz, session.isCompleted]);

  // 4. Autosave state changes helper (whenever session elements update, excluding rapid timer ticks)
  const saveSession = (updatedState: QuizState) => {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updatedState));
  };

  // 5. Actions
  const loadNewQuiz = (newQuiz: Quiz) => {
    const newState: QuizState = {
      quiz: newQuiz,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    };
    setSession(newState);
    saveSession(newState);
  };

  const answerQuestion = (questionId: string | number, optionIndex: number) => {
    setSession((prev) => {
      if (!prev.quiz) return prev;
      
      // If already answered, do not allow changes
      if (prev.answers[questionId] !== undefined) return prev;

      // Find the question object to evaluate correctness
      const currentQuestion = prev.quiz.questions.find((q) => q.id === questionId);
      if (!currentQuestion) return prev;

      const isCorrect = currentQuestion.answer === optionIndex;
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: optionIndex,
      };

      const newScore = isCorrect ? prev.score + 1 : prev.score;

      const updatedState = {
        ...prev,
        answers: updatedAnswers,
        score: newScore,
      };

      saveSession(updatedState);
      return updatedState;
    });
  };

  const nextQuestion = () => {
    setSession((prev) => {
      if (!prev.quiz) return prev;
      const nextIndex = Math.min(prev.currentQuestionIndex + 1, prev.quiz.questions.length - 1);
      const updatedState = {
        ...prev,
        currentQuestionIndex: nextIndex,
      };
      saveSession(updatedState);
      return updatedState;
    });
  };

  const prevQuestion = () => {
    setSession((prev) => {
      if (!prev.quiz) return prev;
      const prevIndex = Math.max(prev.currentQuestionIndex - 1, 0);
      const updatedState = {
        ...prev,
        currentQuestionIndex: prevIndex,
      };
      saveSession(updatedState);
      return updatedState;
    });
  };

  const jumpToQuestion = (index: number) => {
    setSession((prev) => {
      if (!prev.quiz) return prev;
      const targetIndex = Math.max(0, Math.min(index, prev.quiz.questions.length - 1));
      const updatedState = {
        ...prev,
        currentQuestionIndex: targetIndex,
      };
      saveSession(updatedState);
      return updatedState;
    });
  };

  const completeQuiz = () => {
    setSession((prev) => {
      if (!prev.quiz) return prev;
      const updatedState = {
        ...prev,
        isCompleted: true,
      };
      saveSession(updatedState);
      return updatedState;
    });
  };

  const discardQuiz = () => {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setSession({
      quiz: null,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      isCompleted: false,
    });
  };

  return (
    <QuizContext.Provider
      value={{
        quiz: session.quiz,
        currentQuestionIndex: session.currentQuestionIndex,
        answers: session.answers,
        score: session.score,
        timeSpent: session.timeSpent,
        isCompleted: session.isCompleted,
        loadNewQuiz,
        answerQuestion,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        completeQuiz,
        discardQuiz,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
