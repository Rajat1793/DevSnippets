export type Language =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'Java'
  | 'C'
  | 'C++'
  | 'C#'
  | 'Go'
  | 'Rust'
  | 'Ruby'
  | 'PHP'
  | 'Swift'
  | 'Kotlin'
  | 'HTML'
  | 'CSS'
  | 'SQL'
  | 'Shell'
  | 'Markdown'
  | 'JSON'
  | 'YAML'
  | 'Dart'
  | 'Other';

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: Language;
  tags: string[];
  description: string;
  isFavorite: boolean;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetRow {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string;
  description: string;
  is_favorite: number;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  showLineNumbers: boolean;
  aiProvider: 'openai' | 'gemini' | 'custom';
  aiModel: string;
  customAiEndpoint: string;
}

export interface FileItem {
  name: string;
  path: string;
  size: number | null;
  isDirectory: boolean;
  modifiedAt: string | null;
  uri: string;
}

export interface AIExplanation {
  explanation: string;
  summary: string;
  improvements: string[];
}

export type Theme = 'light' | 'dark';
