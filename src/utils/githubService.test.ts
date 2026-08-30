import { describe, it, expect } from 'vitest';
import { buildHierarchyTree, filterTree } from './githubService';

describe('githubService - buildHierarchyTree', () => {
  it('should build hierarchical tree with deep sub-sub folders', () => {
    const rawItems = [
      { path: 'questions/ADVITT/1 Forensic.json', sha: 'sha1', type: 'blob', size: 1024 },
      { path: 'questions/ADVITT/Semester 1/Chapter 1/Intro.json', sha: 'sha2', type: 'blob', size: 2048 },
      { path: 'questions/ADVITT/Semester 1/Chapter 1/Advanced.json', sha: 'sha3', type: 'blob', size: 3072 },
      { path: 'questions/ADVITT/Semester 1/Chapter 2/Test.json', sha: 'sha4', type: 'blob', size: 4096 },
      { path: 'questions/General/GK.json', sha: 'sha5', type: 'blob', size: 512 },
      { path: 'questions/RootQuiz.json', sha: 'sha6', type: 'blob', size: 256 },
      { path: 'questions/ADVITT/README.md', sha: 'sha7', type: 'blob', size: 100 }, // Non-json should be ignored
      { path: 'src/App.tsx', sha: 'sha8', type: 'blob', size: 500 }, // Non-questions should be ignored
    ];

    const tree = buildHierarchyTree(rawItems);

    // Root should contain ADVITT, General, and RootQuiz.json
    expect(tree).toHaveLength(3);

    const advitt = tree.find((node) => node.name === 'ADVITT');
    expect(advitt).toBeDefined();
    expect(advitt?.type).toBe('dir');
    expect(advitt?.totalQuizzesCount).toBe(4);

    // ADVITT children: "Semester 1" folder and "1 Forensic.json" file
    const sem1 = advitt?.children?.find((node) => node.name === 'Semester 1');
    expect(sem1).toBeDefined();
    expect(sem1?.type).toBe('dir');
    expect(sem1?.totalQuizzesCount).toBe(3);

    // Semester 1 children: Chapter 1 and Chapter 2
    const chap1 = sem1?.children?.find((node) => node.name === 'Chapter 1');
    expect(chap1).toBeDefined();
    expect(chap1?.totalQuizzesCount).toBe(2);
    expect(chap1?.children).toHaveLength(2);
    expect(chap1?.children?.[0].name).toBe('Advanced.json');
    expect(chap1?.children?.[1].name).toBe('Intro.json');

    // General folder
    const general = tree.find((node) => node.name === 'General');
    expect(general).toBeDefined();
    expect(general?.totalQuizzesCount).toBe(1);

    // Root-level quiz
    const rootQuiz = tree.find((node) => node.name === 'RootQuiz.json');
    expect(rootQuiz).toBeDefined();
    expect(rootQuiz?.type).toBe('file');
  });
});

describe('githubService - filterTree', () => {
  const tree = buildHierarchyTree([
    { path: 'questions/ADVITT/1 Forensic.json', sha: 'sha1', type: 'blob' },
    { path: 'questions/ADVITT/Semester 1/Chapter 1/Intro.json', sha: 'sha2', type: 'blob' },
    { path: 'questions/General/GK.json', sha: 'sha3', type: 'blob' },
  ]);

  it('should filter by file name and return matching ancestor paths', () => {
    const { filtered, matchingPaths, matchedCount } = filterTree(tree, 'Intro');
    expect(matchedCount).toBe(1);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('ADVITT');

    // Ancestor paths should be in matchingPaths to allow auto-expansion
    expect(matchingPaths.has('questions/ADVITT')).toBe(true);
    expect(matchingPaths.has('questions/ADVITT/Semester 1')).toBe(true);
    expect(matchingPaths.has('questions/ADVITT/Semester 1/Chapter 1')).toBe(true);
    expect(matchingPaths.has('questions/ADVITT/Semester 1/Chapter 1/Intro.json')).toBe(true);
  });

  it('should fuzzy match approximate queries and multi-word terms', () => {
    // "1 foren" matches "1 Forensic.json"
    const { filtered: match1, matchedCount: count1 } = filterTree(tree, '1 foren');
    expect(count1).toBe(1);
    expect(match1).toHaveLength(1);

    // "int" matches "Intro.json"
    const { matchedCount: count2 } = filterTree(tree, 'int');
    expect(count2).toBe(1);
  });

  it('should return empty matches when search term is not found', () => {
    const { filtered, matchedCount } = filterTree(tree, 'NonExistentXYZ');
    expect(matchedCount).toBe(0);
    expect(filtered).toHaveLength(0);
  });

  it('should return entire tree when search query is empty', () => {
    const { filtered, matchedCount } = filterTree(tree, '');
    expect(matchedCount).toBe(0);
    expect(filtered).toEqual(tree);
  });
});
