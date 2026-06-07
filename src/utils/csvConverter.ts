import type { Quiz, Question } from '../types/quiz';

/**
 * A robust CSV parser that handles quotes, escaped quotes, and commas inside fields.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let col = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double-quote
          col += '"';
          i++; // skip next char
        } else {
          // Closing double-quote
          inQuotes = false;
        }
      } else {
        col += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(col.trim());
        col = '';
      } else if (char === '\n' || char === '\r') {
        // Handle newlines
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(col.trim());
        result.push(row);
        row = [];
        col = '';
      } else {
        col += char;
      }
    }
  }
  
  if (col !== '' || row.length > 0) {
    row.push(col.trim());
    result.push(row);
  }
  
  // Filter out empty rows
  return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

interface ConversionOptions {
  title: string;
  description: string;
  answerIndexing: '1-indexed' | '0-indexed' | 'letter'; // A/B/C/D mapping
  autoGenerateIds: boolean;
}

/**
 * Converts a parsed CSV grid to a Quiz object.
 */
export function convertCsvToQuiz(
  csvRows: string[][],
  options: ConversionOptions
): { quiz: Quiz | null; errors: string[] } {
  const errors: string[] = [];
  if (csvRows.length < 2) {
    return { quiz: null, errors: ['CSV file must contain at least a header row and one data row.'] };
  }

  const headers = csvRows[0].map(h => h.toLowerCase().trim().replace(/['"_]/g, ''));
  
  // Map headers to indexes
  const idIdx = headers.indexOf('id');
  const categoryIdx = headers.indexOf('category');
  const questionIdx = headers.indexOf('question');
  const explanationIdx = headers.indexOf('explanation');
  const answerIdx = headers.indexOf('answer');
  
  // Find option columns (e.g. option1, option2, option_1, etc.)
  const optionIndexes: number[] = [];
  headers.forEach((h, idx) => {
    if (h.startsWith('option') || h.startsWith('opt')) {
      optionIndexes.push(idx);
    }
  });

  // Basic column checks
  if (questionIdx === -1) errors.push('Missing required column: "question"');
  if (categoryIdx === -1) errors.push('Missing required column: "category"');
  if (explanationIdx === -1) errors.push('Missing required column: "explanation"');
  if (answerIdx === -1) errors.push('Missing required column: "answer"');
  if (optionIndexes.length < 2) errors.push('At least two "option" columns (e.g., option_1, option_2) are required.');

  if (errors.length > 0) {
    return { quiz: null, errors };
  }

  // Sort option indexes alphabetically/numerically by column header to keep option order correct
  optionIndexes.sort((a, b) => headers[a].localeCompare(headers[b], undefined, { numeric: true }));

  const questions: Question[] = [];

  for (let r = 1; r < csvRows.length; r++) {
    const row = csvRows[r];
    const rowNum = r + 1;
    const prefix = `Row ${rowNum}`;

    // Skip empty lines
    if (row.length === 0 || row.every(cell => cell.trim() === '')) {
      continue;
    }

    // Extract basic fields
    let id: string | number = '';
    if (idIdx !== -1 && row[idIdx]) {
      const parsedId = Number(row[idIdx]);
      id = isNaN(parsedId) ? row[idIdx] : parsedId;
    } else if (options.autoGenerateIds) {
      id = r;
    } else {
      errors.push(`${prefix}: Missing "id" value. You can enable "Auto-generate IDs" in options.`);
    }

    const category = categoryIdx !== -1 ? row[categoryIdx] : '';
    const questionText = questionIdx !== -1 ? row[questionIdx] : '';
    const explanation = explanationIdx !== -1 ? row[explanationIdx] : '';

    if (!category) errors.push(`${prefix}: Category is required.`);
    if (!questionText) errors.push(`${prefix}: Question text is required.`);
    if (!explanation) errors.push(`${prefix}: Explanation is required.`);

    // Extract options
    const optionsList: string[] = [];
    optionIndexes.forEach(idx => {
      if (row[idx] !== undefined && row[idx] !== null && row[idx].trim() !== '') {
        optionsList.push(row[idx]);
      }
    });

    if (optionsList.length < 2) {
      errors.push(`${prefix}: Must have at least 2 non-empty options. Found: ${optionsList.length}.`);
    } else if (optionsList.length > 6) {
      errors.push(`${prefix}: Cannot have more than 6 options. Found: ${optionsList.length}.`);
    }

    // Extract answer index
    const rawAnswer = answerIdx !== -1 ? row[answerIdx].trim() : '';
    let parsedAnswer = -1;

    if (!rawAnswer) {
      errors.push(`${prefix}: Answer is required.`);
    } else {
      if (options.answerIndexing === '1-indexed') {
        const val = parseInt(rawAnswer);
        if (isNaN(val)) {
          errors.push(`${prefix}: Invalid 1-indexed answer "${rawAnswer}". Expected an integer.`);
        } else {
          parsedAnswer = val - 1;
        }
      } else if (options.answerIndexing === '0-indexed') {
        const val = parseInt(rawAnswer);
        if (isNaN(val)) {
          errors.push(`${prefix}: Invalid 0-indexed answer "${rawAnswer}". Expected an integer.`);
        } else {
          parsedAnswer = val;
        }
      } else if (options.answerIndexing === 'letter') {
        // Map A -> 0, B -> 1, etc.
        const letter = rawAnswer.toUpperCase();
        const code = letter.charCodeAt(0) - 65; // 'A' code is 65
        if (code >= 0 && code < 6) {
          parsedAnswer = code;
        } else {
          errors.push(`${prefix}: Invalid letter answer "${rawAnswer}". Expected A, B, C, D, E, or F.`);
        }
      }

      // Range check
      if (parsedAnswer !== -1 && (parsedAnswer < 0 || parsedAnswer >= optionsList.length)) {
        errors.push(
          `${prefix}: Correct answer index ${rawAnswer} resolves to index ${parsedAnswer}, which is out of range for the ${optionsList.length} options provided.`
        );
      }
    }

    if (errors.length === 0) {
      questions.push({
        id,
        category,
        question: questionText,
        options: optionsList,
        answer: parsedAnswer,
        explanation,
      });
    }
  }

  if (errors.length > 0) {
    return { quiz: null, errors };
  }

  return {
    quiz: {
      title: options.title || 'Converted CSV Quiz',
      description: options.description || 'Practice quiz loaded from CSV.',
      version: '1.0',
      questions,
    },
    errors: [],
  };
}
