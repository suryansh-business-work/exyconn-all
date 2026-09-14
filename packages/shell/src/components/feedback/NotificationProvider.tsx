import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
import type { ReactNode } from 'react';
import { Alert, Snackbar, type AlertColor } from '@/components/ui';

interface NotifyState {
  open: boolean;
  message: string;
  severity: AlertColor;
  values?: Interpolations;
}

interface NotificationContextValue {
  /**
   * `message` is the English source; it is translated here. A message with a value in it is
   * written with `{placeholders}` and the values passed separately —
   * `notify('Invoice {number} drafted', 'success', { number })` — never built with a template
   * literal or with `t()` first. Either of those hands this a sentence unique to one record,
   * which misses the catalogue and is sent off to be translated as a new string, every time.
   */
  notify: (message: string, severity?: AlertColor, values?: Interpolations) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/** App-wide MUI snackbar feedback — replaces any native alert() usage (rule 12). */
export function NotificationProvider({ children }: { children: ReactNode }) {
  // Every "Saved", "Could not delete that" and error message in the portal arrives here as an
  // English string from whichever module raised it, which makes this the one place to
  // translate them all.
  const t = useT();
  const [state, setState] = useState<NotifyState>({ open: false, message: '', severity: 'info' });

  const notify = useCallback(
    (message: string, severity: AlertColor = 'success', values?: Interpolations) => {
      setState({ open: true, message, severity, values });
    },
    [],
  );

  const handleClose = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {t(state.message, state.values)}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify(): NotificationContextValue['notify'] {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within a NotificationProvider');
  return ctx.notify;
}
