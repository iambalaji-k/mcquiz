import { describe, it, expect } from 'vitest';
import { parseCSV, convertCsvToQuiz } from './csvConverter';

describe('parseCSV', () => {
  it('should parse simple CSV fields', () => {
    const csv = 'id,category,question\n1,Tax,What is tax?';
    const rows = parseCSV(csv);
    expect(rows).toEqual([
      ['id', 'category', 'question'],
      ['1', 'Tax', 'What is tax?'],
    ]);
  });

  it('should handle quoted fields with commas', () => {
    const csv = 'id,question,explanation\n1,"Is this a test, or not?","This is a test, indeed!"';
    const rows = parseCSV(csv);
    expect(rows[1]).toEqual(['1', 'Is this a test, or not?', 'This is a test, indeed!']);
  });

  it('should handle escaped quotes inside quotes', () => {
    const csv = 'id,question\n1,"Say ""hello"" to the world"';
    const rows = parseCSV(csv);
    expect(rows[1]).toEqual(['1', 'Say "hello" to the world']);
  });
});

describe('convertCsvToQuiz', () => {
  const validCsvRows = [
    ['id', 'category', 'question', 'option_1', 'option_2', 'option_3', 'answer', 'explanation'],
    ['1', 'Tax', 'Q1', 'Opt A', 'Opt B', 'Opt C', '2', 'Exp1'],
    ['2', 'Tax', 'Q2', 'Opt A', 'Opt B', '', 'A', 'Exp2'], // testing letter option as well
  ];

  it('should convert standard 1-indexed CSV rows', () => {
    const result = convertCsvToQuiz(validCsvRows.slice(0, 2), {
      title: 'Tax Test',
      description: 'Desc',
      answerIndexing: '1-indexed',
      autoGenerateIds: false,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.quiz).not.toBeNull();
    expect(result.quiz?.title).toBe('Tax Test');
    expect(result.quiz?.questions[0].id).toBe(1);
    expect(result.quiz?.questions[0].answer).toBe(1); // 2 - 1 = 1 (0-indexed index)
    expect(result.quiz?.questions[0].options).toEqual(['Opt A', 'Opt B', 'Opt C']);
  });

  it('should convert letter answers (A/B/C/D)', () => {
    const rows = [
      ['id', 'category', 'question', 'option_1', 'option_2', 'answer', 'explanation'],
      ['1', 'General', 'Q1', 'Opt A', 'Opt B', 'B', 'Exp1'],
    ];

    const result = convertCsvToQuiz(rows, {
      title: 'Letter Test',
      description: 'Desc',
      answerIndexing: 'letter',
      autoGenerateIds: false,
    });

    expect(result.errors).toHaveLength(0);
    expect(result.quiz?.questions[0].answer).toBe(1); // 'B' -> index 1
  });

  it('should catch missing columns', () => {
    const invalidRows = [
      ['id', 'category', 'question', 'answer'], // Missing options and explanation
      ['1', 'Tax', 'Q1', '1'],
    ];

    const result = convertCsvToQuiz(invalidRows, {
      title: 'Missing Cols',
      description: 'Desc',
      answerIndexing: '1-indexed',
      autoGenerateIds: false,
    });

    expect(result.quiz).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Missing required column'))).toBe(true);
  });

  it('should validate answer ranges', () => {
    const invalidRows = [
      ['id', 'category', 'question', 'option_1', 'option_2', 'answer', 'explanation'],
      ['1', 'Tax', 'Q1', 'A', 'B', '4', 'Exp'], // Answer '4' is out of bounds for 2 options
    ];

    const result = convertCsvToQuiz(invalidRows, {
      title: 'Out of bounds test',
      description: 'Desc',
      answerIndexing: '1-indexed',
      autoGenerateIds: false,
    });

    expect(result.quiz).toBeNull();
    expect(result.errors[0]).toContain('out of range');
  });
});
