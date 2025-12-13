import { useState, useEffect } from 'react';

export interface AutoRefreshSettings {
  enabled: boolean;
  interval: number;
  pauseOnInactive: boolean;
}

const DEFAULT_SETTINGS: AutoRefreshSettings = {
  enabled: true,
  interval: 30000,
  pauseOnInactive: true,
};

const STORAGE_KEY = 'auto-refresh-settings';

export function useAutoRefreshSettings() {
  const [settings, setSettings] = useState<AutoRefreshSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<AutoRefreshSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return { settings, updateSettings };
}
