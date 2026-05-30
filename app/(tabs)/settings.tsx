import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/hooks/useSettings';
import { saveApiKey, getApiKey, deleteApiKey } from '@/services/aiService';
import { exportAllSnippets, shareSnippet } from '@/services/exportService';
import { getAllSnippets, getSnippetCount } from '@/db/database';

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', hint: 'GPT-3.5, GPT-4, GPT-4o' },
  { value: 'gemini', label: 'Google Gemini', hint: 'Gemini Flash, Pro' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', hint: 'LM Studio, Ollama, etc.' },
] as const;

export default function SettingsScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const { settings, updateSettings } = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [snippetCount, setSnippetCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getApiKey().then((k) => setApiKeySet(!!k));
      getSnippetCount().then(setSnippetCount);
    }, [])
  );

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      setSavingKey(true);
      await saveApiKey(apiKeyInput.trim());
      setApiKeySet(true);
      setApiKeyInput('');
      Alert.alert('Saved', 'API key saved securely.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteApiKey = () => {
    Alert.alert('Remove API Key', 'Are you sure you want to remove the saved API key?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setApiKeySet(false);
        },
      },
    ]);
  };

  const handleExportAll = async () => {
    try {
      setExporting(true);
      const snippets = await getAllSnippets();
      if (snippets.length === 0) {
        Alert.alert('No Snippets', 'There are no snippets to export.');
        return;
      }
      const filePath = await exportAllSnippets(snippets);
      await shareSnippet(filePath);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setExporting(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, gap: 20 },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: colors.textMuted,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      gap: 12,
    },
    rowLabel: { flex: 1, fontSize: 15, color: colors.text },
    rowValue: { fontSize: 15, color: colors.textSecondary },
    themeOptions: {
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    themeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center' as const,
      borderWidth: 1.5,
    },
    themeBtnText: { fontSize: 13, fontWeight: '600' as const },
    apiKeyArea: { padding: 16, gap: 10 },
    apiKeyStatus: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingVertical: 8,
    },
    apiKeyStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    apiKeyStatusText: { fontSize: 14, color: colors.textSecondary },
    apiKeyInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
    apiKeyActions: { flexDirection: 'row' as const, gap: 8 },
    btn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    btnText: { color: '#fff', fontWeight: '600' as const, fontSize: 14 },
    providerOptions: { padding: 16, gap: 8 },
    providerOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      gap: 10,
    },
    providerRadio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    providerRadioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    providerLabel: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
    providerHint: { fontSize: 12, color: colors.textSecondary },
    customEndpointInput: {
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
    modelInput: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
    statRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    statLabel: { flex: 1, fontSize: 15, color: colors.text },
    statValue: { fontSize: 22, fontWeight: '700' as const, color: colors.primary },
    exportBtn: {
      marginHorizontal: 16,
      marginBottom: 14,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      backgroundColor: colors.primaryLight,
    },
    exportBtnText: { fontSize: 15, fontWeight: '600' as const, color: colors.primary },
    versionText: { textAlign: 'center' as const, fontSize: 12, color: colors.textMuted },
  });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🎨 Appearance</Text>
          </View>
          <View style={s.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((t) => {
              const selected = themePreference === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.themeBtn,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setThemePreference(t)}
                >
                  <Text style={[s.themeBtnText, { color: selected ? '#fff' : colors.text }]}>
                    {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '💻 System'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.row}>
            <Text style={s.rowLabel}>Font Size</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => settings.fontSize > 10 && updateSettings({ fontSize: settings.fontSize - 1 })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 20, color: colors.primary }}>−</Text>
              </TouchableOpacity>
              <Text style={[s.rowValue, { minWidth: 28, textAlign: 'center' }]}>
                {settings.fontSize}
              </Text>
              <TouchableOpacity
                onPress={() => settings.fontSize < 22 && updateSettings({ fontSize: settings.fontSize + 1 })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 20, color: colors.primary }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.rowLabel}>Show Line Numbers</Text>
            <Switch
              value={settings.showLineNumbers}
              onValueChange={(v) => updateSettings({ showLineNumbers: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* AI Provider */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🤖 AI Provider</Text>
          </View>

          <View style={s.providerOptions}>
            {AI_PROVIDERS.map((p) => {
              const selected = settings.aiProvider === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    s.providerOption,
                    {
                      backgroundColor: selected ? colors.primaryLight : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateSettings({ aiProvider: p.value })}
                >
                  <View style={[s.providerRadio, { borderColor: selected ? colors.primary : colors.border }]}>
                    {selected && <View style={[s.providerRadioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.providerLabel}>{p.label}</Text>
                    <Text style={s.providerHint}>{p.hint}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {settings.aiProvider === 'custom' && (
              <TextInput
                style={s.customEndpointInput}
                value={settings.customAiEndpoint}
                onChangeText={(v) => updateSettings({ customAiEndpoint: v })}
                placeholder="https://your-endpoint/v1"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            )}
          </View>

          <Text style={[s.sectionTitle, { paddingHorizontal: 16, paddingBottom: 8 }]}>Model</Text>
          <TextInput
            style={s.modelInput}
            value={settings.aiModel}
            onChangeText={(v) => updateSettings({ aiModel: v })}
            placeholder={
              settings.aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* API Key */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>🔑 API Key (Stored Securely)</Text>
          </View>
          <View style={s.apiKeyArea}>
            <View style={s.apiKeyStatus}>
              <View style={[s.apiKeyStatusDot, { backgroundColor: apiKeySet ? colors.success : colors.textMuted }]} />
              <Text style={s.apiKeyStatusText}>
                {apiKeySet ? 'API key is configured' : 'No API key saved'}
              </Text>
            </View>
            <TextInput
              style={s.apiKeyInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Enter your API key..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={s.apiKeyActions}>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.primary, opacity: apiKeyInput.trim() ? 1 : 0.5 }]}
                onPress={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || savingKey}
              >
                {savingKey ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.btnText}>Save Key</Text>
                )}
              </TouchableOpacity>
              {apiKeySet && (
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: colors.error }]}
                  onPress={handleDeleteApiKey}
                >
                  <Text style={s.btnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Data & Export */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📦 Data & Export</Text>
          </View>
          <View style={s.statRow}>
            <Text style={s.statLabel}>Total Snippets</Text>
            <Text style={s.statValue}>{snippetCount}</Text>
          </View>
          <TouchableOpacity style={s.exportBtn} onPress={handleExportAll} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={s.exportBtnText}>📤 Export All Snippets as JSON</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>ℹ️ About</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>SDK</Text>
            <Text style={s.rowValue}>Expo SDK 55</Text>
          </View>
        </View>

        <Text style={s.versionText}>DevSnippets · Built with Expo SDK 55</Text>
      </ScrollView>
    </View>
  );
}
