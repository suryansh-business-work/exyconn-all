import type { ReactNode } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';

interface Props {
  loading: boolean;
  error: string | null;
  empty: boolean;
  /** English source string shown when there is nothing yet. */
  emptyText: string;
  onRetry: () => void;
  children: ReactNode;
}

/** The loading, error and empty states every panel tab shares. */
export function PanelState({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
  children,
}: Readonly<Props>) {
  const t = useT();
  if (error !== null) {
    return (
      <Stack spacing={1}>
        <Alert severity="error">{t(error)}</Alert>
        <Button size="small" onClick={onRetry}>
          {t('Retry')}
        </Button>
      </Stack>
    );
  }
  if (empty && loading) {
    return <CircularProgress size={24} aria-label={t('Loading')} />;
  }
  if (empty) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t(emptyText)}
      </Typography>
    );
  }
  return <>{children}</>;
}
