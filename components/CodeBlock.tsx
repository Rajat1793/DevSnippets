import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/context/ThemeContext';

interface CodeBlockProps {
  code: string;
  language?: string;
  fontSize?: number;
  showLineNumbers?: boolean;
  maxHeight?: number;
}

export function CodeBlock({
  code,
  language,
  fontSize = 13,
  showLineNumbers = true,
  maxHeight,
}: CodeBlockProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.codeBackground }]}>
      <View style={[styles.header, { borderBottomColor: '#ffffff15' }]}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.dot, { backgroundColor: '#FEBC2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#28C840' }]} />
        </View>
        {language && (
          <Text style={styles.langLabel}>{language}</Text>
        )}
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          <Text style={styles.copyText}>{copied ? '✓ Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={maxHeight ? { maxHeight } : undefined}
        nestedScrollEnabled
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.codeArea}>
            {showLineNumbers && (
              <View style={styles.lineNumbers}>
                {lines.map((_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.lineNumber,
                      { fontSize, color: '#4B5563' },
                    ]}
                  >
                    {i + 1}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.codeLines}>
              {lines.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.codeLine,
                    { fontSize, color: colors.codeText },
                  ]}
                >
                  {line || ' '}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  langLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ffffff20',
    borderRadius: 4,
  },
  copyText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  codeArea: {
    flexDirection: 'row',
    padding: 12,
  },
  lineNumbers: {
    marginRight: 12,
    alignItems: 'flex-end',
  },
  lineNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
    opacity: 0.4,
  },
  codeLines: {
    flex: 1,
  },
  codeLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});
