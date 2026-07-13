import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Snackbar, type AlertColor } from '@/components/ui';

interface NotifyState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface NotificationContextValue {
  notify: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/** App-wide MUI snackbar feedback — replaces any native alert() usage (rule 12). */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotifyState>({ open: false, message: '', severity: 'info' });

  const notify = useCallback((message: string, severity: AlertColor = 'success') => {
    setState({ open: true, message, severity });
  }, []);

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
          {state.message}
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
