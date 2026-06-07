import { describe, it, expect } from 'vitest';
import { validateQuiz, parseAndValidateQuiz } from './validation';

describe('validateQuiz', () => {
  it('should validate a correct quiz structure', () => {
    const validQuiz = {
      title: 'Income Tax Practice Set 01',
      description: 'Practice questions',
      version: '1.0',
      questions: [
        {
          id: 1,
          category: 'Income Tax',
          question: 'What is the basic exemption limit?',
          options: ['100000', '200000', '300000', '400000'],
          answer: 2,
          explanation: 'Current exemption limit is 300000.',
        },
      ],
    };

    const result = validateQuiz(validQuiz);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing title', () => {
    const invalidQuiz = {
      description: 'Practice questions',
      questions: [
        {
          id: 1,
          category: 'Income Tax',
          question: 'What is the basic exemption limit?',
          options: ['100000', '200000'],
          answer: 0,
          explanation: 'Some explanation',
        },
      ],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing "title" property in the quiz file.');
  });

  it('should detect empty questions array', () => {
    const invalidQuiz = {
      title: 'Empty Quiz',
      questions: [],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('The "questions" array cannot be empty. Please include at least one question.');
  });

  it('should detect duplicate question IDs', () => {
    const invalidQuiz = {
      title: 'Duplicate IDs Quiz',
      questions: [
        {
          id: 1,
          category: 'Tax',
          question: 'Q1',
          options: ['A', 'B'],
          answer: 0,
          explanation: 'Exp',
        },
        {
          id: 1, // duplicate id
          category: 'Tax',
          question: 'Q2',
          options: ['A', 'B'],
          answer: 1,
          explanation: 'Exp',
        },
      ],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate ID "1" detected'))).toBe(true);
  });

  it('should detect invalid option count', () => {
    const invalidQuiz = {
      title: 'Invalid Options Quiz',
      questions: [
        {
          id: 1,
          category: 'Tax',
          question: 'Q1',
          options: ['A'], // Only 1 option (minimum is 2)
          answer: 0,
          explanation: 'Exp',
        },
      ],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Must have between 2 and 6 options'))).toBe(true);
  });

  it('should detect out of bounds answer index', () => {
    const invalidQuiz = {
      title: 'Invalid Answer Quiz',
      questions: [
        {
          id: 1,
          category: 'Tax',
          question: 'Q1',
          options: ['A', 'B'],
          answer: 2, // invalid (must be 0 or 1)
          explanation: 'Exp',
        },
      ],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Contains an invalid answer index 2'))).toBe(true);
  });

  it('should detect missing explanation and category', () => {
    const invalidQuiz = {
      title: 'Missing Details Quiz',
      questions: [
        {
          id: 1,
          question: 'Q1',
          options: ['A', 'B'],
          answer: 0,
          // Missing category and explanation
        },
      ],
    };

    const result = validateQuiz(invalidQuiz);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Missing "category"'))).toBe(true);
    expect(result.errors.some(e => e.includes('Missing "explanation"'))).toBe(true);
  });

  it('should handle corrupt JSON string parsing', () => {
    const corruptJsonString = '{"title": "Corrupt", "questions": [}';
    const result = parseAndValidateQuiz(corruptJsonString);
    expect(result.isValid).toBe(false);
    expect(result.quiz).toBeNull();
    expect(result.errors[0]).toContain('Invalid JSON formatting');
  });
});
