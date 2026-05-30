import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useSnippets } from '@/hooks/useSnippets';
import { searchSnippets } from '@/db/database';
import { SnippetCard } from '@/components/SnippetCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { Snippet, Language } from '@/types';
import { LANGUAGES } from '@/constants/Languages';

const FILTER_ALL = 'All';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { snippets, loading, refresh, toggleSnippetFavorite } = useSnippets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Snippet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [langFilter, setLangFilter] = useState<Language | typeof FILTER_ALL>(FILTER_ALL);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchSnippets(searchQuery.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const displayedSnippets = searchQuery.trim()
    ? searchResults
    : langFilter === FILTER_ALL
    ? snippets
    : snippets.filter((s) => s.language === langFilter);

  const usedLanguages = Array.from(new Set(snippets.map((s) => s.language)));

  const ListHeader = (
    <View>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {!searchQuery && usedLanguages.length > 0 && (
        <FlatList
          horizontal
          data={[FILTER_ALL, ...usedLanguages]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const selected = item === langFilter;
            return (
              <TouchableOpacity
                onPress={() => setLangFilter(item as Language | typeof FILTER_ALL)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selected ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {searchQuery.trim() ? (
        <Text style={[styles.resultCount, { color: colors.textMuted }]}>
          {isSearching ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
        </Text>
      ) : (
        <Text style={[styles.resultCount, { color: colors.textMuted }]}>
          {displayedSnippets.length} snippet{displayedSnippets.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  if (loading && snippets.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayedSnippets}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            icon={searchQuery ? '🔍' : '💻'}
            title={searchQuery ? 'No results found' : 'No snippets yet'}
            subtitle={
              searchQuery
                ? `No snippets match "${searchQuery}"`
                : 'Tap + to create your first snippet'
            }
          />
        }
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onFavoriteToggle={() => toggleSnippetFavorite(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          displayedSnippets.length === 0 ? styles.emptyContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/snippet/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});

