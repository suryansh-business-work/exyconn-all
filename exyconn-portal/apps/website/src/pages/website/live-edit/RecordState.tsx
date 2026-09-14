import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress } from '@exyconn/shell/components/ui';

interface RecordStateProps {
  loading: boolean;
  error?: Error;
  /** What is being loaded, for the messages ("blog post", "case study"). */
  label: string;
}

/** What a live-edit page shows before its record is ready: a spinner, the error, or "gone". */
export function RecordState({ loading, error, label }: Readonly<RecordStateProps>) {
  const t = useT();
  const what = t(label);
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={t('Loading the {what}', { what })} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {t('Could not load the {what}: {reason}', { what, reason: error.message })}
      </Alert>
    );
  }
  return <Alert severity="warning">{t('That {what} no longer exists.', { what })}</Alert>;
}
