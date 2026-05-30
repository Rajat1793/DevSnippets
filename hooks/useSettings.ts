import { AppSettings } from "@/types";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const SETTINGS_KEY = "devsnippets_settings";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  fontSize: 14,
  showLineNumbers: true,
  aiProvider: "openai",
  aiModel: "gpt-4o-mini",
  customAiEndpoint: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(SETTINGS_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<AppSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings],
  );

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await SecureStore.setItemAsync(
      SETTINGS_KEY,
      JSON.stringify(DEFAULT_SETTINGS),
    );
  }, []);

  return { settings, loading, updateSettings, resetSettings };
}
