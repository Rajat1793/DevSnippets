import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AIExplanation } from '@/types';

interface AIExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  explanation: AIExplanation | null;
  error: string | null;
  snippetTitle: string;
  onRetry?: () => void;
}

export function AIExplanationModal({
  visible,
  onClose,
  loading,
  explanation,
  error,
  snippetTitle,
  onRetry,
}: AIExplanationModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.aiIcon}>🤖</Text>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                AI Explanation
              </Text>
              <Text style={[styles.snippetName, { color: colors.textSecondary }]} numberOfLines={1}>
                {snippetTitle}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Analyzing your code...
              </Text>
            </View>
          )}

          {error && !loading && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error + '44' }]}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              {onRetry && (
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: colors.error }]}
                  onPress={onRetry}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {explanation && !loading && (
            <>
              {/* Summary */}
              <Section title="📌 Summary" color={colors.primary}>
                <View style={[styles.summaryBox, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    {explanation.summary}
                  </Text>
                </View>
              </Section>

              {/* Explanation */}
              <Section title="📖 Explanation" color={colors.success}>
                <Text style={[styles.explanationText, { color: colors.text }]}>
                  {explanation.explanation}
                </Text>
              </Section>

              {/* Improvements */}
              {explanation.improvements.length > 0 && (
                <Section title="💡 Improvement Suggestions" color={colors.warning}>
                  {explanation.improvements.map((improvement, index) => (
                    <View key={index} style={styles.improvementItem}>
                      <View style={[styles.improvementDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.improvementText, { color: colors.text }]}>
                        {improvement}
                      </Text>
                    </View>
                  ))}
                </Section>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: color }]} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aiIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  snippetName: {
    fontSize: 13,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryBox: {
    borderRadius: 8,
    padding: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 24,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  improvementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  improvementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});
