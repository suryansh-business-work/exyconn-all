import { useState, useEffect, useCallback } from 'react';
import { LogoSettings, CustomSize } from '../types';

const STORAGE_KEY = 'logo-set-state';

export interface AppState {
  image: string | null;
  globalSettings: LogoSettings | null;
  sizeSettings: Record<string, LogoSettings>;
  croppedImages: Record<string, string>;
  format: string;
  customSizes: CustomSize[];
}

const defaultState: AppState = {
  image: null,
  globalSettings: null,
  sizeSettings: {},
  croppedImages: {},
  format: 'png',
  customSizes: [],
};

export const useLocalStorage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const saveState = useCallback((state: Partial<AppState>) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const current = existing ? JSON.parse(existing) : defaultState;
      const newState = { ...current, ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, []);

  const loadState = useCallback((): AppState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
    return defaultState;
  }, []);

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear state:', e);
    }
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return { saveState, loadState, clearState, isLoaded };
};

export default useLocalStorage;
