import { Colors, ColorScheme } from "@/constants/Colors";
import { Theme } from "@/types";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

const THEME_KEY = "devsnippets_theme";

interface ThemeContextValue {
  theme: Theme;
  themePreference: "light" | "dark" | "system";
  colors: ColorScheme;
  setThemePreference: (pref: "light" | "dark" | "system") => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  themePreference: "system",
  colors: Colors.light,
  setThemePreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePref] = useState<"light" | "dark" | "system">(
    "system",
  );

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemePref(stored);
      }
    });
  }, []);

  const resolvedTheme: Theme =
    themePreference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const setThemePreference = async (pref: "light" | "dark" | "system") => {
    setThemePref(pref);
    await SecureStore.setItemAsync(THEME_KEY, pref);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themePreference,
        colors: Colors[resolvedTheme],
        setThemePreference,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
