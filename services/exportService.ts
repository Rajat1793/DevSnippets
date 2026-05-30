import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Snippet } from '@/types';
import { LANGUAGE_EXTENSIONS } from '@/constants/Languages';

function getExportsDir(): Directory {
  const dir = new Directory(Paths.document, 'exports');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export async function exportSnippetAsTxt(snippet: Snippet): Promise<string> {
  const dir = getExportsDir();
  const filename = sanitizeFilename(snippet.title) + '.txt';
  const file = new File(dir, filename);
  const content = buildTxtContent(snippet);
  file.write(content);
  return file.uri;
}

export async function exportSnippetAsCode(snippet: Snippet): Promise<string> {
  const dir = getExportsDir();
  const ext = LANGUAGE_EXTENSIONS[snippet.language] ?? '.txt';
  const filename = sanitizeFilename(snippet.title) + ext;
  const file = new File(dir, filename);
  file.write(snippet.code);
  return file.uri;
}

export async function exportSnippetAsJson(snippet: Snippet): Promise<string> {
  const dir = getExportsDir();
  const filename = sanitizeFilename(snippet.title) + '.json';
  const file = new File(dir, filename);
  const content = JSON.stringify(
    {
      title: snippet.title,
      language: snippet.language,
      description: snippet.description,
      tags: snippet.tags,
      code: snippet.code,
      createdAt: snippet.createdAt,
    },
    null,
    2
  );
  file.write(content);
  return file.uri;
}

export async function shareSnippet(fileUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    UTI: 'public.plain-text',
    dialogTitle: 'Share Snippet',
  });
}

export async function exportAllSnippets(snippets: Snippet[]): Promise<string> {
  const dir = getExportsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `devsnippets-export-${timestamp}.json`;
  const file = new File(dir, filename);
  const content = JSON.stringify(
    snippets.map((s) => ({
      id: s.id,
      title: s.title,
      language: s.language,
      description: s.description,
      tags: s.tags,
      code: s.code,
      isFavorite: s.isFavorite,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    null,
    2
  );
  file.write(content);
  return file.uri;
}

export async function downloadTemplate(name: string, content: string): Promise<string> {
  const dir = new Directory(Paths.document, 'templates');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, sanitizeFilename(name) + '.txt');
  file.write(content);
  return file.uri;
}

export async function getExportedFiles(): Promise<string[]> {
  const dir = getExportsDir();
  return dir.list().map((item) => (item as File).name);
}

function buildTxtContent(snippet: Snippet): string {
  return [
    `Title: ${snippet.title}`,
    `Language: ${snippet.language}`,
    `Tags: ${snippet.tags.join(', ')}`,
    `Description: ${snippet.description}`,
    `Created: ${snippet.createdAt}`,
    '',
    '--- CODE ---',
    '',
    snippet.code,
  ].join('\n');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50) || 'snippet';
}

