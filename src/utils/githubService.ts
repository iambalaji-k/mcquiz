export interface QuizTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'dir' | 'file';
  size?: number;
  sha: string;
  downloadUrl?: string;
  children?: QuizTreeNode[];
  totalQuizzesCount?: number;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const REPO_OWNER = 'iambalaji-k';
const REPO_NAME = 'mcquiz';
const DEFAULT_BRANCH = 'main';

function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.error('Failed to set localStorage cache:', e);
  }
}

interface TempDirNode {
  name: string;
  path: string;
  type: 'dir';
  subdirs: Map<string, TempDirNode>;
  files: QuizTreeNode[];
}

function convertTempDirToTreeNode(dir: TempDirNode): QuizTreeNode {
  const children: QuizTreeNode[] = [];

  // Sort subdirectories naturally
  const sortedSubdirs = Array.from(dir.subdirs.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  for (const sub of sortedSubdirs) {
    const childNode = convertTempDirToTreeNode(sub);
    // Only include subfolder if it contains at least 1 quiz file in its descendants
    if (childNode.totalQuizzesCount && childNode.totalQuizzesCount > 0) {
      children.push(childNode);
    }
  }

  // Sort files naturally
  const sortedFiles = [...dir.files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
  children.push(...sortedFiles);

  const totalQuizzesCount = children.reduce((acc, child) => {
    if (child.type === 'file') return acc + 1;
    return acc + (child.totalQuizzesCount || 0);
  }, 0);

  return {
    id: dir.path,
    name: dir.name,
    path: dir.path,
    type: 'dir',
    sha: dir.path,
    children,
    totalQuizzesCount,
  };
}

/**
 * Builds a multi-level hierarchical tree from raw git tree items
 */
export function buildHierarchyTree(items: { path: string; size?: number; sha: string; type: string }[], branch = DEFAULT_BRANCH): QuizTreeNode[] {
  const rootDir: TempDirNode = {
    name: 'questions',
    path: 'questions',
    type: 'dir',
    subdirs: new Map(),
    files: [],
  };

  const jsonItems = items.filter(
    (item) =>
      item.path.startsWith('questions/') &&
      (item.type === 'blob' || !item.type) &&
      item.path.toLowerCase().endsWith('.json')
  );

  for (const item of jsonItems) {
    const relativePath = item.path.slice('questions/'.length);
    const segments = relativePath.split('/').filter(Boolean);

    let currentDir = rootDir;
    let accumulatedPath = 'questions';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isFile = i === segments.length - 1;
      accumulatedPath += '/' + segment;

      if (isFile) {
        const encodedPath = item.path.split('/').map(encodeURIComponent).join('/');
        currentDir.files.push({
          id: accumulatedPath,
          name: segment,
          path: item.path,
          type: 'file',
          size: item.size,
          sha: item.sha,
          downloadUrl: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${branch}/${encodedPath}`,
        });
      } else {
        if (!currentDir.subdirs.has(segment)) {
          currentDir.subdirs.set(segment, {
            name: segment,
            path: accumulatedPath,
            type: 'dir',
            subdirs: new Map(),
            files: [],
          });
        }
        currentDir = currentDir.subdirs.get(segment)!;
      }
    }
  }

  const convertedRoot = convertTempDirToTreeNode(rootDir);
  return convertedRoot.children || [];
}

/**
 * Fetches the complete recursive tree from GitHub repository
 */
export async function fetchQuizTree(forceRefresh = false): Promise<QuizTreeNode[]> {
  const cacheKey = `mcquiz-github-full-tree-v2`;
  if (!forceRefresh) {
    const cached = getCache<QuizTreeNode[]>(cacheKey);
    if (cached) return cached;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${DEFAULT_BRANCH}?recursive=1`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later or upload files directly.');
    }
    if (response.status === 404) {
      throw new Error(`Repository branch '${DEFAULT_BRANCH}' or questions folder not found.`);
    }
    throw new Error(`Failed to fetch repository tree: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.tree || !Array.isArray(data.tree)) {
    throw new Error('Invalid response structure from GitHub Trees API.');
  }

  if (data.truncated) {
    console.warn('GitHub Trees API response was truncated because the repository is very large.');
  }

  const tree = buildHierarchyTree(data.tree, DEFAULT_BRANCH);
  setCache(cacheKey, tree);
  return tree;
}

export async function fetchQuizJson(downloadUrl: string): Promise<unknown> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download quiz file: ${response.statusText}`);
  }
  return response.json();
}

export function clearGithubCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mcquiz-github-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error('Failed to clear GitHub cache:', e);
  }
}

/**
 * Filters the multi-level tree by search term, returning matching nodes and paths that should be expanded.
 */
export function filterTree(
  nodes: QuizTreeNode[],
  searchTerm: string
): { filtered: QuizTreeNode[]; matchingPaths: Set<string>; matchedCount: number } {
  const normalized = searchTerm.trim().toLowerCase();
  const matchingPaths = new Set<string>();
  let matchedCount = 0;

  if (!normalized) {
    return { filtered: nodes, matchingPaths, matchedCount: 0 };
  }

  function filterNode(node: QuizTreeNode): QuizTreeNode | null {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(normalized)) {
        matchingPaths.add(node.id);
        matchedCount++;
        return node;
      }
      return null;
    }

    const isSelfMatch = node.name.toLowerCase().includes(normalized);
    const filteredChildren: QuizTreeNode[] = [];

    if (node.children) {
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          filteredChildren.push(filteredChild);
        }
      }
    }

    if (isSelfMatch || filteredChildren.length > 0) {
      matchingPaths.add(node.id);
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      };
    }

    return null;
  }

  const filtered: QuizTreeNode[] = [];
  for (const node of nodes) {
    const result = filterNode(node);
    if (result) {
      filtered.push(result);
    }
  }

  return { filtered, matchingPaths, matchedCount };
}

