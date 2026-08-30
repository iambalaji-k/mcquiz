import { useContext } from 'react';
import { QuizContext } from '../context/QuizContextTypes';

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
