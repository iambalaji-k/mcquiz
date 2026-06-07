import type { Quiz, ValidationResult } from '../types/quiz';

/**
 * Validates a quiz object or parsed JSON data against the required schema.
 */
export function validateQuiz(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Invalid JSON format. Expected a JSON object at the root.'],
    };
  }

  // 1. Title Validation
  if (!data.title) {
    errors.push('Missing "title" property in the quiz file.');
  } else if (typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('The "title" property must be a non-empty string.');
  }

  // 2. Questions Array Validation
  if (!data.questions) {
    errors.push('Missing "questions" property. The file must contain a questions array.');
    return { isValid: false, errors };
  }

  if (!Array.isArray(data.questions)) {
    errors.push('The "questions" property must be an array.');
    return { isValid: false, errors };
  }

  if (data.questions.length === 0) {
    errors.push('The "questions" array cannot be empty. Please include at least one question.');
    return { isValid: false, errors };
  }

  // 3. Question Item Validation
  const seenIds = new Set<string | number>();

  data.questions.forEach((q: any, index: number) => {
    const qNum = index + 1;
    const prefix = `Question ${qNum} (at index ${index})`;

    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      errors.push(`${prefix}: Must be a valid JSON object.`);
      return; // Skip further checks for this item if it's not an object
    }

    // ID Validation
    if (q.id === undefined || q.id === null) {
      errors.push(`${prefix}: Missing unique "id".`);
    } else {
      if (typeof q.id !== 'number' && typeof q.id !== 'string') {
        errors.push(`${prefix}: "id" must be a number or a string.`);
      } else {
        if (seenIds.has(q.id)) {
          errors.push(`${prefix}: Duplicate ID "${q.id}" detected. All question IDs must be unique.`);
        } else {
          seenIds.add(q.id);
        }
      }
    }

    // Question Text Validation
    if (!q.question) {
      errors.push(`${prefix}: Missing "question" text.`);
    } else if (typeof q.question !== 'string' || q.question.trim() === '') {
      errors.push(`${prefix}: "question" must be a non-empty string.`);
    }

    // Category Validation
    if (!q.category) {
      errors.push(`${prefix}: Missing "category".`);
    } else if (typeof q.category !== 'string' || q.category.trim() === '') {
      errors.push(`${prefix}: "category" must be a non-empty string.`);
    }

    // Options Validation
    if (!q.options) {
      errors.push(`${prefix}: Missing "options" list.`);
    } else if (!Array.isArray(q.options)) {
      errors.push(`${prefix}: "options" must be an array.`);
    } else {
      if (q.options.length < 2 || q.options.length > 6) {
        errors.push(`${prefix}: Must have between 2 and 6 options. Current options count: ${q.options.length}.`);
      }
      q.options.forEach((opt: any, optIdx: number) => {
        if (opt === undefined || opt === null) {
          errors.push(`${prefix}, Option ${optIdx + 1}: Option cannot be empty.`);
        } else if (typeof opt !== 'string' && typeof opt !== 'number') {
          errors.push(`${prefix}, Option ${optIdx + 1}: Option must be a string or number.`);
        }
      });
    }

    // Answer Validation
    if (q.answer === undefined || q.answer === null) {
      errors.push(`${prefix}: Missing "answer" index.`);
    } else if (typeof q.answer !== 'number') {
      errors.push(`${prefix}: "answer" must be a number representing the correct option index.`);
    } else if (Array.isArray(q.options)) {
      if (q.answer < 0 || q.answer >= q.options.length) {
        errors.push(`${prefix}: Contains an invalid answer index ${q.answer}. It must be between 0 and ${q.options.length - 1}.`);
      }
    }

    // Explanation Validation
    if (!q.explanation) {
      errors.push(`${prefix}: Missing "explanation".`);
    } else if (typeof q.explanation !== 'string' || q.explanation.trim() === '') {
      errors.push(`${prefix}: "explanation" must be a non-empty string.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to parse a JSON string safely and validate it.
 */
export function parseAndValidateQuiz(jsonString: string): ValidationResult & { quiz: Quiz | null } {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateQuiz(data);
    return {
      ...validation,
      quiz: validation.isValid ? (data as Quiz) : null,
    };
  } catch (error: any) {
    return {
      isValid: false,
      errors: [`Invalid JSON formatting: ${error.message || 'Syntax error'}`],
      quiz: null,
    };
  }
}
