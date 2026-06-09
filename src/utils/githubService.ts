export interface GitHubContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const REPO_OWNER = 'iambalaji-k';
const REPO_NAME = 'mcquiz';

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

export async function fetchRootFolders(forceRefresh = false): Promise<string[]> {
  const cacheKey = `mcquiz-github-folders`;
  if (!forceRefresh) {
    const cached = getCache<string[]>(cacheKey);
    if (cached) return cached;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/questions`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later or upload files locally.');
    }
    throw new Error(`Failed to fetch questions directory: ${response.statusText}`);
  }

  const items: GitHubContentItem[] = await response.json();
  const folders = items
    .filter((item) => item.type === 'dir')
    .map((item) => item.name);

  setCache(cacheKey, folders);
  return folders;
}

export async function fetchFolderFiles(folderName: string, forceRefresh = false): Promise<GitHubContentItem[]> {
  const cacheKey = `mcquiz-github-files-${folderName}`;
  if (!forceRefresh) {
    const cached = getCache<GitHubContentItem[]>(cacheKey);
    if (cached) return cached;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/questions/${encodeURIComponent(folderName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch folder contents: ${response.statusText}`);
  }

  const items: GitHubContentItem[] = await response.json();
  const jsonFiles = items.filter(
    (item) => item.type === 'file' && item.name.toLowerCase().endsWith('.json')
  );

  setCache(cacheKey, jsonFiles);
  return jsonFiles;
}

export async function fetchQuizJson(downloadUrl: string): Promise<any> {
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
