import { Alert, Box, CircularProgress } from '@exyconn/shell/components/ui';

interface RecordStateProps {
  loading: boolean;
  error?: Error;
  /** What is being loaded, for the messages ("blog post", "case study"). */
  label: string;
}

/** What a live-edit page shows before its record is ready: a spinner, the error, or "gone". */
export function RecordState({ loading, error, label }: Readonly<RecordStateProps>) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={`Loading the ${label}`} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        Could not load the {label}: {error.message}
      </Alert>
    );
  }
  return <Alert severity="warning">That {label} no longer exists.</Alert>;
}
