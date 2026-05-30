import React, { useState } from 'react';
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
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { createSnippet } from '@/db/database';
import { LanguagePicker } from '@/components/LanguagePicker';
import { TagInput } from '@/components/TagInput';
import { Language } from '@/types';

export default function CreateSnippetScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('JavaScript');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your snippet.');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Missing Code', 'Please enter some code for your snippet.');
      return;
    }
    try {
      setSaving(true);
      await createSnippet({
        title: title.trim(),
        code: code.trim(),
        language,
        tags,
        description: description.trim(),
        isFavorite: false,
        filePath: null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save snippet: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ marginRight: 4, paddingHorizontal: 8 }}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [saving, title, code, handleSave]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Field label="Title *" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Debounce function"
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="next"
          />
        </Field>

        {/* Language */}
        <Field label="Language *" colors={colors}>
          <LanguagePicker value={language} onChange={setLanguage} />
        </Field>

        {/* Description */}
        <Field label="Description" colors={colors}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of what this snippet does"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
          />
        </Field>

        {/* Tags */}
        <Field label="Tags" colors={colors}>
          <TagInput tags={tags} onChange={setTags} />
        </Field>

        {/* Code */}
        <Field label="Code *" colors={colors}>
          <TextInput
            style={[
              styles.codeInput,
              {
                color: colors.codeText,
                backgroundColor: colors.codeBackground,
                borderColor: colors.border,
                fontSize: 13,
              },
            ]}
            value={code}
            onChangeText={setCode}
            placeholder={`// Paste or type your ${language} code here`}
            placeholderTextColor="#4B5563"
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />
        </Field>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: title.trim() && code.trim() ? colors.primary : colors.border,
            },
          ]}
          onPress={handleSave}
          disabled={saving || !title.trim() || !code.trim()}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Snippet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
