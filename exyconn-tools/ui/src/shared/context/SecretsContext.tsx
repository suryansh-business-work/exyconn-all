import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SecretsDrawer } from '../components/SecretsDrawer';

interface SecretsContextValue {
  /**
   * Opens the secrets drawer. Pass a secret key to expand its category and
   * highlight that field, so an error message can point straight at the input
   * the user needs to fill.
   */
  openSecrets: (highlightKey?: string) => void;
  closeSecrets: () => void;
  isOpen: boolean;
}

const SecretsContext = createContext<SecretsContextValue | undefined>(undefined);

/**
 * Hosts the secrets drawer once, above the router, so every page — the tools
 * list and each individual tool — can open it. It used to be local state in
 * ToolsPage, which is why tool pages had no way to reach it.
 */
export const SecretsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightKey, setHighlightKey] = useState<string | undefined>(undefined);

  const openSecrets = useCallback((key?: string) => {
    setHighlightKey(key);
    setIsOpen(true);
  }, []);

  const closeSecrets = useCallback(() => {
    setIsOpen(false);
    setHighlightKey(undefined);
  }, []);

  const value = useMemo(
    () => ({ openSecrets, closeSecrets, isOpen }),
    [openSecrets, closeSecrets, isOpen],
  );

  return (
    <SecretsContext.Provider value={value}>
      {children}
      <SecretsDrawer open={isOpen} onClose={closeSecrets} highlightKey={highlightKey} />
    </SecretsContext.Provider>
  );
};

export const useSecrets = (): SecretsContextValue => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error('useSecrets must be used within a SecretsProvider');
  }
  return context;
};
