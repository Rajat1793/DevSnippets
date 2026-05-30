import * as SQLite from 'expo-sqlite';
import { Snippet, SnippetRow, Language } from '@/types';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('devsnippets.db');
      await initializeDatabase(database);
      db = database;
      return database;
    })();
  }
  return dbInitPromise;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL');
  await database.execAsync('PRAGMA foreign_keys = ON');
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'Other',
      tags TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      file_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language)');
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_snippets_is_favorite ON snippets(is_favorite)');
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at)');
}

function rowToSnippet(row: SnippetRow): Snippet {
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags);
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    language: row.language as Language,
    tags,
    description: row.description,
    isFavorite: row.is_favorite === 1,
    filePath: row.file_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllSnippets(): Promise<Snippet[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SnippetRow>(
    'SELECT * FROM snippets ORDER BY updated_at DESC'
  );
  return rows.map(rowToSnippet);
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SnippetRow>(
    'SELECT * FROM snippets WHERE id = ?',
    [id]
  );
  return row ? rowToSnippet(row) : null;
}

export async function getFavoriteSnippets(): Promise<Snippet[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SnippetRow>(
    'SELECT * FROM snippets WHERE is_favorite = 1 ORDER BY updated_at DESC'
  );
  return rows.map(rowToSnippet);
}

export async function searchSnippets(query: string): Promise<Snippet[]> {
  const database = await getDatabase();
  const searchTerm = `%${query}%`;
  const rows = await database.getAllAsync<SnippetRow>(
    `SELECT * FROM snippets
     WHERE title LIKE ? OR code LIKE ? OR description LIKE ? OR tags LIKE ?
     ORDER BY updated_at DESC`,
    [searchTerm, searchTerm, searchTerm, searchTerm]
  );
  return rows.map(rowToSnippet);
}

export async function getSnippetsByLanguage(language: Language): Promise<Snippet[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SnippetRow>(
    'SELECT * FROM snippets WHERE language = ? ORDER BY updated_at DESC',
    [language]
  );
  return rows.map(rowToSnippet);
}

export async function createSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Snippet> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO snippets (id, title, code, language, tags, description, is_favorite, file_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      snippet.title,
      snippet.code,
      snippet.language,
      JSON.stringify(snippet.tags),
      snippet.description,
      snippet.isFavorite ? 1 : 0,
      snippet.filePath ?? null,
      now,
      now,
    ]
  );
  return {
    ...snippet,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateSnippet(id: string, updates: Partial<Omit<Snippet, 'id' | 'createdAt'>>): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.code !== undefined) { fields.push('code = ?'); values.push(updates.code); }
  if (updates.language !== undefined) { fields.push('language = ?'); values.push(updates.language); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.isFavorite !== undefined) { fields.push('is_favorite = ?'); values.push(updates.isFavorite ? 1 : 0); }
  if (updates.filePath !== undefined) { fields.push('file_path = ?'); values.push(updates.filePath); }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE snippets SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteSnippet(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM snippets WHERE id = ?', [id]);
}

export async function toggleFavorite(id: string, current: boolean): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    'UPDATE snippets SET is_favorite = ?, updated_at = ? WHERE id = ?',
    [current ? 0 : 1, now, id]
  );
}

export async function getSnippetCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM snippets'
  );
  return result?.count ?? 0;
}

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}
