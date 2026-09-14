import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
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
  /** Values for a title written with `{placeholders}`. */
  titleValues?: Interpolations;
  /**
   * The English source, translated here. A message naming a record is written with
   * `{placeholders}` and `messageValues` — `'Delete "{name}"?'` with `{ name }` — never a
   * template literal or a `t()` result, which would reach the catalogue once per record.
   */
  message: string;
  messageValues?: Interpolations;
  confirmText?: string;
  cancelText?: string;
}

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | undefined>(
  undefined,
);

/** MUI confirmation dialog — replaces native confirm() (CLAUDE.md rule 12). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useT();
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
        <DialogTitle>{t(options?.title ?? 'Please confirm', options?.titleValues)}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {options?.message ? t(options.message, options.messageValues) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => settle(false)} color="inherit">
            {t(options?.cancelText ?? 'Cancel')}
          </Button>
          <Button onClick={() => settle(true)} variant="contained">
            {t(options?.confirmText ?? 'Confirm')}
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
