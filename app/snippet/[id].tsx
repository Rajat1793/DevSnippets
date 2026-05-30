import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect, useNavigation } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { getSnippetById, updateSnippet, deleteSnippet, toggleFavorite } from '@/db/database';
import { Snippet, Language, AIExplanation } from '@/types';
import { CodeBlock } from '@/components/CodeBlock';
import { LanguagePicker } from '@/components/LanguagePicker';
import { TagInput } from '@/components/TagInput';
import { AIExplanationModal } from '@/components/AIExplanationModal';
import { generateExplanation } from '@/services/aiService';
import {
  exportSnippetAsTxt,
  exportSnippetAsCode,
  exportSnippetAsJson,
  shareSnippet,
} from '@/services/exportService';
import { pickAndAttachImage } from '@/services/fileService';
import { useSettings } from '@/hooks/useSettings';

type Mode = 'view' | 'edit';

export default function SnippetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const navigation = useNavigation();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLanguage, setEditLanguage] = useState<Language>('JavaScript');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');

  // AI state
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Export modal
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const loadSnippet = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getSnippetById(id);
      if (data) {
        setSnippet(data);
        setEditTitle(data.title);
        setEditCode(data.code);
        setEditLanguage(data.language);
        setEditTags(data.tags);
        setEditDescription(data.description);
      }
    } catch (err) {
      console.error('SnippetDetail.load:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadSnippet(); }, [loadSnippet]));

  React.useLayoutEffect(() => {
    if (!snippet) return;
    navigation.setOptions({
      title: mode === 'edit' ? 'Edit Snippet' : snippet.title,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
          {mode === 'view' ? (
            <>
              <TouchableOpacity
                onPress={() => handleToggleFavorite()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 20, color: snippet.isFavorite ? colors.favorite : colors.textMuted }}>
                  {snippet.isFavorite ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('edit')}
                style={{ paddingHorizontal: 8 }}
              >
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Edit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setMode('view')} style={{ paddingHorizontal: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 4 }}>
                {saving ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [snippet, mode, saving]);

  const handleSave = async () => {
    if (!snippet || !editTitle.trim() || !editCode.trim()) return;
    try {
      setSaving(true);
      await updateSnippet(snippet.id, {
        title: editTitle.trim(),
        code: editCode.trim(),
        language: editLanguage,
        tags: editTags,
        description: editDescription.trim(),
      });
      await loadSnippet();
      setMode('view');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!snippet) return;
    await toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippet({ ...snippet, isFavorite: !snippet.isFavorite });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Snippet',
      `Delete "${snippet?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!snippet) return;
            await deleteSnippet(snippet.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAiExplain = async () => {
    if (!snippet) return;
    setAiModalVisible(true);
    setAiLoading(true);
    setAiError(null);
    setAiExplanation(null);
    try {
      const result = await generateExplanation(snippet.code, snippet.language, settings);
      setAiExplanation(result);
    } catch (err: any) {
      setAiError(err.message ?? 'Failed to generate explanation.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = async (format: 'txt' | 'code' | 'json') => {
    if (!snippet) return;
    setExportModalVisible(false);
    try {
      let filePath: string;
      if (format === 'txt') filePath = await exportSnippetAsTxt(snippet);
      else if (format === 'code') filePath = await exportSnippetAsCode(snippet);
      else filePath = await exportSnippetAsJson(snippet);
      await shareSnippet(filePath);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    }
  };

  const handleAttachImage = async () => {
    if (!snippet) return;
    try {
      const path = await pickAndAttachImage(snippet.id);
      if (path) {
        await updateSnippet(snippet.id, { filePath: path });
        await loadSnippet();
        Alert.alert('Attached', 'Image attached to this snippet.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!snippet) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Snippet not found</Text>
      </View>
    );
  }

  // ---- VIEW MODE ----
  if (mode === 'view') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
          {/* Meta */}
          <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Language</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{snippet.language}</Text>
            </View>
            {snippet.description ? (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Description</Text>
                <Text style={[styles.metaValue, { color: colors.text, flex: 1, textAlign: 'right' }]}>
                  {snippet.description}
                </Text>
              </View>
            ) : null}
            {snippet.tags.length > 0 && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Tags</Text>
                <View style={styles.tagsInline}>
                  {snippet.tags.map((t) => (
                    <View key={t} style={[styles.tagBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.tagBadgeText, { color: colors.primary }]}>#{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Updated</Text>
              <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
                {new Date(snippet.updatedAt).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Code */}
          <CodeBlock
            code={snippet.code}
            language={snippet.language}
            fontSize={settings.fontSize}
            showLineNumbers={settings.showLineNumbers}
          />

          {/* Action Buttons */}
          <View style={styles.actionsGrid}>
            <ActionBtn
              icon="🤖"
              label="AI Explain"
              color={colors.primary}
              bg={colors.primaryLight}
              onPress={handleAiExplain}
            />
            <ActionBtn
              icon="📤"
              label="Export"
              color={colors.success}
              bg={colors.successLight}
              onPress={() => setExportModalVisible(true)}
            />
            <ActionBtn
              icon="📎"
              label="Attach"
              color={colors.warning}
              bg={colors.warningLight}
              onPress={handleAttachImage}
            />
            <ActionBtn
              icon="🗑️"
              label="Delete"
              color={colors.error}
              bg={colors.errorLight}
              onPress={handleDelete}
            />
          </View>

          {snippet.filePath && (
            <View style={[styles.attachmentNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.attachmentIcon}>📎</Text>
              <Text style={[styles.attachmentText, { color: colors.textSecondary }]} numberOfLines={1}>
                {snippet.filePath.split('/').pop()}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Export Modal */}
        <Modal
          visible={exportModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setExportModalVisible(false)}
        >
          <View style={[styles.exportModal, { backgroundColor: colors.background }]}>
            <View style={[styles.exportHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.exportTitle, { color: colors.text }]}>Export Snippet</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptions}>
              {[
                { format: 'txt', icon: '📃', label: '.txt', desc: 'Plain text with metadata' },
                { format: 'code', icon: '💾', label: 'Source file', desc: `Export as .${snippet.language.toLowerCase()} file` },
                { format: 'json', icon: '📋', label: '.json', desc: 'Structured JSON with all fields' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.format}
                  style={[styles.exportOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleExport(opt.format as 'txt' | 'code' | 'json')}
                >
                  <Text style={styles.exportOptionIcon}>{opt.icon}</Text>
                  <View>
                    <Text style={[styles.exportOptionLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[styles.exportOptionDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* AI Modal */}
        <AIExplanationModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
          loading={aiLoading}
          explanation={aiExplanation}
          error={aiError}
          snippetTitle={snippet.title}
          onRetry={handleAiExplain}
        />
      </View>
    );
  }

  // ---- EDIT MODE ----
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={styles.editContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Title *" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Snippet title"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Language *" colors={colors}>
          <LanguagePicker value={editLanguage} onChange={setEditLanguage} />
        </Field>

        <Field label="Description" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Brief description"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </Field>

        <Field label="Tags" colors={colors}>
          <TagInput tags={editTags} onChange={setEditTags} />
        </Field>

        <Field label="Code *" colors={colors}>
          <TextInput
            style={[
              styles.codeInput,
              {
                color: colors.codeText,
                backgroundColor: colors.codeBackground,
                borderColor: colors.border,
                fontSize: settings.fontSize,
              },
            ]}
            value={editCode}
            onChangeText={setEditCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />
        </Field>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={styles.actionBtnIcon}>{icon}</Text>
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ label, colors, children }: { label: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewContent: { padding: 16, gap: 14, paddingBottom: 40 },
  editContent: { padding: 16, gap: 16, paddingBottom: 40 },
  metaCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#00000015',
    gap: 12,
  },
  metaLabel: { fontSize: 13, fontWeight: '500' },
  metaValue: { fontSize: 13 },
  tagsInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  tagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagBadgeText: { fontSize: 11, fontWeight: '500' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnIcon: { fontSize: 22 },
  actionBtnLabel: { fontSize: 13, fontWeight: '600' },
  attachmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  attachmentIcon: { fontSize: 18 },
  attachmentText: { flex: 1, fontSize: 13 },
  exportModal: { flex: 1 },
  exportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  exportTitle: { fontSize: 17, fontWeight: '600' },
  exportOptions: { padding: 16, gap: 12 },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 14,
  },
  exportOptionIcon: { fontSize: 28 },
  exportOptionLabel: { fontSize: 15, fontWeight: '600' },
  exportOptionDesc: { fontSize: 13, marginTop: 2 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 240,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  saveButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
