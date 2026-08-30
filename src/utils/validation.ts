import type { Quiz, ValidationResult } from '../types/quiz';

/**
 * Validates a quiz object or parsed JSON data against the required schema.
 */
export function validateQuiz(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Invalid JSON format. Expected a JSON object at the root.'],
    };
  }

  const quizObj = data as Record<string, unknown>;

  // 1. Title Validation
  if (!quizObj.title) {
    errors.push('Missing "title" property in the quiz file.');
  } else if (typeof quizObj.title !== 'string' || quizObj.title.trim() === '') {
    errors.push('The "title" property must be a non-empty string.');
  }

  // 2. Questions Array Validation
  if (!quizObj.questions) {
    errors.push('Missing "questions" property. The file must contain a questions array.');
    return { isValid: false, errors };
  }

  if (!Array.isArray(quizObj.questions)) {
    errors.push('The "questions" property must be an array.');
    return { isValid: false, errors };
  }

  if (quizObj.questions.length === 0) {
    errors.push('The "questions" array cannot be empty. Please include at least one question.');
    return { isValid: false, errors };
  }

  // 3. Question Item Validation
  const seenIds = new Set<string>();

  quizObj.questions.forEach((q: unknown, index: number) => {
    const qNum = index + 1;
    const prefix = `Question ${qNum} (at index ${index})`;

    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      errors.push(`${prefix}: Must be a valid JSON object.`);
      return; // Skip further checks for this item if it's not an object
    }

    const item = q as Record<string, unknown>;

    // ID Validation
    if (item.id === undefined || item.id === null) {
      errors.push(`${prefix}: Missing unique "id".`);
    } else {
      if (typeof item.id !== 'number' && typeof item.id !== 'string') {
        errors.push(`${prefix}: "id" must be a number or a string.`);
      } else {
        const strId = String(item.id);
        if (seenIds.has(strId)) {
          errors.push(`${prefix}: Duplicate ID "${item.id}" detected. All question IDs must be unique.`);
        } else {
          seenIds.add(strId);
        }
      }
    }

    // Question Text Validation
    if (!item.question) {
      errors.push(`${prefix}: Missing "question" text.`);
    } else if (typeof item.question !== 'string' || item.question.trim() === '') {
      errors.push(`${prefix}: "question" must be a non-empty string.`);
    }

    // Category Validation
    if (!item.category) {
      errors.push(`${prefix}: Missing "category".`);
    } else if (typeof item.category !== 'string' || item.category.trim() === '') {
      errors.push(`${prefix}: "category" must be a non-empty string.`);
    }

    // Options Validation
    if (!item.options) {
      errors.push(`${prefix}: Missing "options" list.`);
    } else if (!Array.isArray(item.options)) {
      errors.push(`${prefix}: "options" must be an array.`);
    } else {
      if (item.options.length < 2 || item.options.length > 6) {
        errors.push(`${prefix}: Must have between 2 and 6 options. Current options count: ${item.options.length}.`);
      }
      item.options.forEach((opt: unknown, optIdx: number) => {
        if (opt === undefined || opt === null) {
          errors.push(`${prefix}, Option ${optIdx + 1}: Option cannot be empty.`);
        } else if (typeof opt !== 'string' && typeof opt !== 'number') {
          errors.push(`${prefix}, Option ${optIdx + 1}: Option must be a string or number.`);
        }
      });
    }

    // Answer Validation
    if (item.answer === undefined || item.answer === null) {
      errors.push(`${prefix}: Missing "answer" index.`);
    } else if (typeof item.answer !== 'number') {
      errors.push(`${prefix}: "answer" must be a number representing the correct option index.`);
    } else if (Array.isArray(item.options)) {
      if (item.answer < 0 || item.answer >= item.options.length) {
        errors.push(`${prefix}: Contains an invalid answer index ${item.answer}. It must be between 0 and ${item.options.length - 1}.`);
      }
    }

    // Explanation Validation
    if (!item.explanation) {
      errors.push(`${prefix}: Missing "explanation".`);
    } else if (typeof item.explanation !== 'string' || item.explanation.trim() === '') {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Syntax error';
    return {
      isValid: false,
      errors: [`Invalid JSON formatting: ${message}`],
      quiz: null,
    };
  }
}
