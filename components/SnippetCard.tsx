import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Snippet } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGE_COLORS } from '@/constants/Languages';

interface SnippetCardProps {
  snippet: Snippet;
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export function SnippetCard({ snippet, onPress, onFavoriteToggle }: SnippetCardProps) {
  const { colors } = useTheme();
  const langColor = LANGUAGE_COLORS[snippet.language] ?? '#64748B';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.langDot, { backgroundColor: langColor }]} />
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {snippet.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.star, { color: snippet.isFavorite ? colors.favorite : colors.textMuted }]}>
            {snippet.isFavorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {snippet.description ? (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {snippet.description}
        </Text>
      ) : null}

      <View style={[styles.codePreview, { backgroundColor: colors.codeBackground }]}>
        <Text
          style={[styles.codeText, { color: colors.codeText }]}
          numberOfLines={3}
        >
          {snippet.code.trim()}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={[styles.langBadge, { backgroundColor: langColor + '22' }]}>
          <View style={[styles.langDotSmall, { backgroundColor: langColor }]} />
          <Text style={[styles.langText, { color: langColor }]}>
            {snippet.language}
          </Text>
        </View>

        <View style={styles.tagsRow}>
          {snippet.tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
            </View>
          ))}
          {snippet.tags.length > 3 && (
            <Text style={[styles.moreText, { color: colors.textMuted }]}>
              +{snippet.tags.length - 3}
            </Text>
          )}
        </View>

        <Text style={[styles.date, { color: colors.textMuted }]}>
          {formatDate(snippet.updatedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  langDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  star: {
    fontSize: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  codePreview: {
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  langDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
  },
  date: {
    fontSize: 11,
    marginLeft: 'auto',
  },
});
