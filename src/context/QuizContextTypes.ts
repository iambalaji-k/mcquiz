import { createContext } from 'react';
import type { Quiz } from '../types/quiz';

export interface QuizContextType {
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

export const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const ACTIVE_SESSION_KEY = 'quiz-app-active-session';
export const ACTIVE_QUIZ_KEY = 'quiz-app-active-quiz';
export const ACTIVE_PROGRESS_KEY = 'quiz-app-active-progress';
export const THEME_KEY = 'quiz-app-theme';
