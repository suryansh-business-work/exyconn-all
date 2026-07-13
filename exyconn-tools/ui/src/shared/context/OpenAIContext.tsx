import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface OpenAIContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isKeySet: boolean;
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined);

const STORAGE_KEY = 'openai_api_key';

export const OpenAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) {
      setApiKeyState(storedKey);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
  }, []);

  return (
    <OpenAIContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        isKeySet: !!apiKey,
      }}
    >
      {children}
    </OpenAIContext.Provider>
  );
};

export const useOpenAI = (): OpenAIContextType => {
  const context = useContext(OpenAIContext);
  if (!context) {
    throw new Error('useOpenAI must be used within an OpenAIProvider');
  }
  return context;
};
