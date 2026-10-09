import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface OpenAIContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isKeySet: boolean;
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined);

const STORAGE_KEY = 'openai_api_key';

export const OpenAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedKey, setStoredKey] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) {
      setStoredKey(storedKey);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setStoredKey(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredKey(null);
  }, []);

  const value = useMemo(
    () => ({
      apiKey: storedKey,
      setApiKey,
      clearApiKey,
      isKeySet: !!storedKey,
    }),
    [storedKey, setApiKey, clearApiKey]
  );

  return <OpenAIContext.Provider value={value}>{children}</OpenAIContext.Provider>;
};

export const useOpenAI = (): OpenAIContextType => {
  const context = useContext(OpenAIContext);
  if (!context) {
    throw new Error('useOpenAI must be used within an OpenAIProvider');
  }
  return context;
};
