import { describe, it, expect } from 'vitest';
import { sampleBalancedQuestions, getCategoryBreakdown, prepareQuizAttempt } from './quizUtils';
import type { Question, Quiz } from '../types/quiz';

const mockQuestions: Question[] = [
  // 10 questions in Topic A
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `A-${i + 1}`,
    category: 'Topic A',
    question: `Question A ${i + 1}`,
    options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
    answer: 0,
    explanation: 'Exp',
  })),
  // 10 questions in Topic B
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `B-${i + 1}`,
    category: 'Topic B',
    question: `Question B ${i + 1}`,
    options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
    answer: 1,
    explanation: 'Exp',
  })),
  // 10 questions in Topic C
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `C-${i + 1}`,
    category: 'Topic C',
    question: `Question C ${i + 1}`,
    options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
    answer: 2,
    explanation: 'Exp',
  })),
];

describe('quizUtils - sampleBalancedQuestions', () => {
  it('should return exact number of requested questions', () => {
    const sampled = sampleBalancedQuestions(mockQuestions, 12);
    expect(sampled).toHaveLength(12);
  });

  it('should balance questions evenly across different concepts/topics', () => {
    // Request 6 questions across 3 topics -> exactly 2 per topic
    const sampled = sampleBalancedQuestions(mockQuestions, 6);
    expect(sampled).toHaveLength(6);

    const breakdown = getCategoryBreakdown(sampled);
    expect(breakdown['Topic A']).toBe(2);
    expect(breakdown['Topic B']).toBe(2);
    expect(breakdown['Topic C']).toBe(2);
  });

  it('should handle small counts and pick diverse topics', () => {
    // Request 3 questions across 3 topics -> 1 from each
    const sampled = sampleBalancedQuestions(mockQuestions, 3);
    expect(sampled).toHaveLength(3);

    const breakdown = getCategoryBreakdown(sampled);
    expect(breakdown['Topic A']).toBe(1);
    expect(breakdown['Topic B']).toBe(1);
    expect(breakdown['Topic C']).toBe(1);
  });

  it('should handle request for all questions', () => {
    const sampled = sampleBalancedQuestions(mockQuestions, 30);
    expect(sampled).toHaveLength(30);
    const breakdown = getCategoryBreakdown(sampled);
    expect(breakdown['Topic A']).toBe(10);
    expect(breakdown['Topic B']).toBe(10);
    expect(breakdown['Topic C']).toBe(10);
  });

  it('should clamp counts below 1 and above total', () => {
    const minSampled = sampleBalancedQuestions(mockQuestions, 0);
    expect(minSampled).toHaveLength(1);

    const maxSampled = sampleBalancedQuestions(mockQuestions, 100);
    expect(maxSampled).toHaveLength(30);
  });

  it('should prepare quiz attempt correctly with updated question count', () => {
    const quiz: Quiz = {
      title: 'Mock Full Quiz',
      questions: mockQuestions,
    };

    const attempt = prepareQuizAttempt(quiz, 15);
    expect(attempt.questions).toHaveLength(15);
    expect(attempt.title).toBe('Mock Full Quiz');
  });
});
