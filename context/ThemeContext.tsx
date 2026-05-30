import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from '@/constants/Colors';
import { Theme } from '@/types';

const THEME_KEY = '@devsnippets:theme';

interface ThemeContextValue {
  theme: Theme;
  themePreference: 'light' | 'dark' | 'system';
  colors: ColorScheme;
  setThemePreference: (pref: 'light' | 'dark' | 'system') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  themePreference: 'system',
  colors: Colors.light,
  setThemePreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePref] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemePref(stored);
      }
    });
  }, []);

  const resolvedTheme: Theme =
    themePreference === 'system'
      ? systemScheme === 'dark' ? 'dark' : 'light'
      : themePreference;

  const setThemePreference = async (pref: 'light' | 'dark' | 'system') => {
    setThemePref(pref);
    await AsyncStorage.setItem(THEME_KEY, pref);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themePreference,
        colors: Colors[resolvedTheme],
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
