import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import {
  listDirectory,
  deleteFile,
  createFolder,
  pickAndImportDocument,
  APP_FILES_DIR,
  ATTACHMENTS_DIR,
  EXPORTS_DIR,
  TEMPLATES_DIR,
  formatFileSize,
  getFileIcon,
} from '@/services/fileService';
import { FileItem } from '@/types';
import { EmptyState } from '@/components/EmptyState';

const ROOT_DIRS = [
  { key: APP_FILES_DIR, label: 'My Files', icon: '📂' },
  { key: EXPORTS_DIR, label: 'Exports', icon: '📤' },
  { key: ATTACHMENTS_DIR, label: 'Attachments', icon: '🖼️' },
  { key: TEMPLATES_DIR, label: 'Templates', icon: '📋' },
];

export default function FilesScreen() {
  const { colors } = useTheme();
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState('File Manager');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pathStack, setPathStack] = useState<{ path: string; label: string }[]>([]);

  const loadDir = useCallback(async (dir: string) => {
    try {
      setLoading(true);
      const items = await listDirectory(dir);
      setFiles(items);
    } catch (err) {
      console.error('FilesScreen.loadDir:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentDir) loadDir(currentDir);
    }, [currentDir, loadDir])
  );

  const openDir = (path: string, label: string) => {
    if (currentDir) {
      setPathStack((prev) => [...prev, { path: currentDir, label: currentLabel }]);
    }
    setCurrentDir(path);
    setCurrentLabel(label);
    loadDir(path);
  };

  const goBack = () => {
    const prev = pathStack[pathStack.length - 1];
    if (prev) {
      setPathStack((s) => s.slice(0, -1));
      setCurrentDir(prev.path);
      setCurrentLabel(prev.label);
      loadDir(prev.path);
    } else {
      setCurrentDir(null);
      setCurrentLabel('File Manager');
    }
  };

  const handleDelete = (item: FileItem) => {
    Alert.alert(
      'Delete',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFile(item.path);
            if (currentDir) loadDir(currentDir);
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (!currentDir) return;
    try {
      const result = await pickAndImportDocument(currentDir);
      if (result) loadDir(currentDir);
    } catch (err: any) {
      Alert.alert('Import Failed', err.message);
    }
  };

  const handleNewFolder = () => {
    Alert.prompt(
      'New Folder',
      'Enter folder name:',
      async (name) => {
        if (!name?.trim() || !currentDir) return;
        try {
          await createFolder(currentDir, name.trim());
          loadDir(currentDir);
        } catch (err: any) {
          Alert.alert('Error', err.message);
        }
      },
      'plain-text'
    );
  };

  // Root view — show folder categories
  if (!currentDir) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.rootGrid}>
          {ROOT_DIRS.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.rootCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => openDir(d.key, d.label)}
            >
              <Text style={styles.rootIcon}>{d.icon}</Text>
              <Text style={[styles.rootLabel, { color: colors.text }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Tap a folder to browse its contents
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.breadcrumbTitle, { color: colors.text }]} numberOfLines={1}>
          {currentLabel}
        </Text>
      </View>

      {/* Action Bar */}
      <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
          onPress={handleImport}
        >
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Import File</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={handleNewFolder}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>📁 New Folder</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.path}
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              title="Empty folder"
              subtitle="Import files or create new folders here"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.fileItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (item.isDirectory) openDir(item.path + '/', item.name);
              }}
              onLongPress={() => handleDelete(item)}
            >
              <Text style={styles.fileIcon}>{getFileIcon(item.name, item.isDirectory)}</Text>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.fileMeta, { color: colors.textMuted }]}>
                  {item.isDirectory ? 'Folder' : formatFileSize(item.size)}
                  {item.modifiedAt ? ` · ${formatDate(item.modifiedAt)}` : ''}
                </Text>
              </View>
              {item.isDirectory ? (
                <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
              ) : (
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.deleteBtn, { color: colors.error }]}>🗑</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => loadDir(currentDir)}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={files.length === 0 ? styles.emptyContent : undefined}
        />
      )}
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rootGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  rootCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rootIcon: { fontSize: 36 },
  rootLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center', paddingBottom: 20 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 15, fontWeight: '500' },
  breadcrumbTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  fileIcon: { fontSize: 24 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500' },
  fileMeta: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 20, fontWeight: '300' },
  deleteBtn: { fontSize: 18 },
  emptyContent: { flexGrow: 1 },
});
