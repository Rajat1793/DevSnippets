import { useState, useEffect, useCallback } from 'react';
import {
  getAllSnippets,
  getFavoriteSnippets,
  searchSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  toggleFavorite,
  getSnippetById,
  getSnippetsByLanguage,
} from '@/db/database';
import { Snippet, Language } from '@/types';

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnippets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllSnippets();
      setSnippets(data);
    } catch (err) {
      setError('Failed to load snippets');
      console.error('useSnippets.loadSnippets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const addSnippet = useCallback(async (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Snippet> => {
    const created = await createSnippet(snippet);
    setSnippets((prev) => [created, ...prev]);
    return created;
  }, []);

  const editSnippet = useCallback(async (id: string, updates: Partial<Omit<Snippet, 'id' | 'createdAt'>>) => {
    await updateSnippet(id, updates);
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const removeSnippet = useCallback(async (id: string) => {
    await deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleSnippetFavorite = useCallback(async (id: string) => {
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) return;
    await toggleFavorite(id, snippet.isFavorite);
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
  }, [snippets]);

  return {
    snippets,
    loading,
    error,
    refresh: loadSnippets,
    addSnippet,
    editSnippet,
    removeSnippet,
    toggleSnippetFavorite,
  };
}

export function useFavoriteSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavoriteSnippets();
      setSnippets(data);
    } catch (err) {
      console.error('useFavoriteSnippets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { snippets, loading, refresh: load };
}

export function useSnippetSearch() {
  const [results, setResults] = useState<Snippet[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const data = await searchSnippets(query.trim());
      setResults(data);
    } catch (err) {
      console.error('useSnippetSearch:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  return { results, searching, search };
}

export function useSnippet(id: string) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSnippetById(id);
      setSnippet(data);
    } catch (err) {
      console.error('useSnippet:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { snippet, loading, refresh: load };
}

export function useSnippetsByLanguage(language: Language | null) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!language) {
      setSnippets([]);
      return;
    }
    setLoading(true);
    getSnippetsByLanguage(language)
      .then(setSnippets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [language]);

  return { snippets, loading };
}
