export interface Question {
  id: number | string;
  category: string;
  question: string;
  options: string[];
  answer: number; // Index of the correct option in options (0-indexed)
  explanation: string;
}

export interface Quiz {
  title: string;
  description?: string;
  version?: string;
  questions: Question[];
}

export interface QuizState {
  quiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<string | number, number>; // questionId -> selectedOptionIndex
  score: number;
  timeSpent: number; // cumulative time spent in seconds
  isCompleted: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
