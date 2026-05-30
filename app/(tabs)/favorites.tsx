import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useFavoriteSnippets } from '@/hooks/useSnippets';
import { toggleFavorite } from '@/db/database';
import { SnippetCard } from '@/components/SnippetCard';
import { EmptyState } from '@/components/EmptyState';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { snippets, loading, refresh } = useFavoriteSnippets();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleFavoriteToggle = async (id: string, current: boolean) => {
    await toggleFavorite(id, current);
    refresh();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={snippets}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          snippets.length > 0 ? (
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {snippets.length} favorite{snippets.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="⭐"
            title="No favorites yet"
            subtitle="Star snippets to save them here for quick access"
          />
        }
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onFavoriteToggle={() => handleFavoriteToggle(item.id, item.isFavorite)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          snippets.length === 0 ? styles.emptyContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  count: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: { paddingBottom: 40 },
  emptyContent: { flexGrow: 1 },
});
