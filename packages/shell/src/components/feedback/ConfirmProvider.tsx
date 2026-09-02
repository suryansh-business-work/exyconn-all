import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@/components/ui';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | undefined>(
  undefined,
);

/** MUI confirmation dialog — replaces native confirm() (CLAUDE.md rule 12). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<Resolver | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(options)} onClose={() => settle(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{options?.title ?? 'Please confirm'}</DialogTitle>
        <DialogContent>
          <DialogContentText>{options?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => settle(false)} color="inherit">
            {options?.cancelText ?? 'Cancel'}
          </Button>
          <Button onClick={() => settle(true)} variant="contained" autoFocus>
            {options?.confirmText ?? 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
