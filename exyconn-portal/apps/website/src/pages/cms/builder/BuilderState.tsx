import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress } from '@exyconn/shell/components/ui';

interface BuilderStateProps {
  loading: boolean;
  error?: Error;
  /** What is being opened: "page", "fragment". */
  label: string;
}

/** What the builder shows until its document and resources are ready. */
export function BuilderState({ loading, error, label }: Readonly<BuilderStateProps>) {
  const t = useT();
  const what = t(label);
  if (error) {
    return (
      <Alert severity="error">
        {t('Could not open the {what}: {reason}', { what, reason: error.message })}
      </Alert>
    );
  }
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={t('Opening the {what}', { what })} />
      </Box>
    );
  }
  return <Alert severity="warning">{t('That {what} no longer exists.', { what })}</Alert>;
}
