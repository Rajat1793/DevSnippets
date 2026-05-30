import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Language } from '@/types';
import { LANGUAGES, LANGUAGE_COLORS } from '@/constants/Languages';

interface LanguagePickerProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(search.toLowerCase())
  );

  const langColor = LANGUAGE_COLORS[value] ?? '#64748B';

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setVisible(true)}
      >
        <View style={[styles.dot, { backgroundColor: langColor }]} />
        <Text style={[styles.triggerText, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.chevron, { color: colors.textMuted }]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Language
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search languages..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const color = LANGUAGE_COLORS[item] ?? '#64748B';
              const selected = item === value;
              return (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? colors.primaryLight : 'transparent',
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    onChange(item);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <View style={[styles.langDot, { backgroundColor: color }]} />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: selected ? colors.primary : colors.text,
                        fontWeight: selected ? '600' : '400',
                      },
                    ]}
                  >
                    {item}
                  </Text>
                  {selected && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  chevron: {
    fontSize: 10,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchWrapper: {
    padding: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  langDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
