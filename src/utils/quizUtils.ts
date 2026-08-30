import type { Quiz, Question } from '../types/quiz';

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Computes category distribution breakdown for a list of questions.
 */
export function getCategoryBreakdown(questions: Question[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) {
    const cat = (q.category && q.category.trim()) ? q.category.trim() : 'General';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * Samples `count` questions from a quiz in a balanced manner across all distinct topics/categories.
 * Questions within each category and the final question order are randomized.
 */
export function sampleBalancedQuestions(
  questions: Question[],
  count: number,
  randomize = true
): Question[] {
  if (!questions || questions.length === 0) return [];
  const targetCount = Math.max(1, Math.min(count, questions.length));

  // If user requested all questions without shuffle
  if (targetCount === questions.length && !randomize) {
    return [...questions];
  }

  // 1. Group questions by category / topic
  const categoryMap = new Map<string, Question[]>();
  for (const q of questions) {
    const cat = (q.category && q.category.trim()) ? q.category.trim() : 'General';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(q);
  }

  // 2. Prepare shuffled pools for each category
  const categories = Array.from(categoryMap.keys());
  const categoryPools: Question[][] = categories.map((cat) =>
    randomize ? shuffleArray(categoryMap.get(cat)!) : [...categoryMap.get(cat)!]
  );

  // 3. Round-robin draw across categories to balance topic representation
  const selected: Question[] = [];
  const categoryIndices = categories.map((_, i) => i);
  
  if (randomize) {
    for (let i = categoryIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [categoryIndices[i], categoryIndices[j]] = [categoryIndices[j], categoryIndices[i]];
    }
  }

  while (selected.length < targetCount) {
    let itemAddedInThisRound = false;

    for (const catIdx of categoryIndices) {
      if (selected.length >= targetCount) break;
      const pool = categoryPools[catIdx];
      if (pool.length > 0) {
        selected.push(pool.shift()!);
        itemAddedInThisRound = true;
      }
    }

    if (!itemAddedInThisRound) break;
  }

  // 4. Shuffle final selection so questions from same topic are dispersed throughout the quiz
  return randomize ? shuffleArray(selected) : selected;
}

/**
 * Prepares a quiz attempt with user's chosen question count and balanced topic distribution.
 */
export function prepareQuizAttempt(
  originalQuiz: Quiz,
  desiredCount: number,
  randomize = true
): Quiz {
  const sampledQuestions = sampleBalancedQuestions(originalQuiz.questions, desiredCount, randomize);
  return {
    ...originalQuiz,
    questions: sampledQuestions,
  };
}
