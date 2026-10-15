import DownloadIcon from '@mui/icons-material/Download';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { ImportRunState } from '../useImportRun';

/** How many issues are listed on screen; the CSV has them all. */
const LISTED_ISSUES = 20;

interface ResultStepProps {
  state: ImportRunState;
  onDownloadIssues: () => void;
}

function Count({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Stack spacing={0.5}>
      <Text size="sm" color="text.secondary">
        {label}
      </Text>
      <Text size="lg" weight="bold">
        {value}
      </Text>
    </Stack>
  );
}

function StopNotice({ state }: Readonly<{ state: ImportRunState }>) {
  const t = useT();
  const values = { done: state.done, total: state.total };
  if (state.error) {
    return (
      <Alert severity="error">
        {t('The import stopped after {done} of {total} rows: {error}', {
          ...values,
          error: state.error,
        })}
      </Alert>
    );
  }
  if (state.cancelled) {
    return (
      <Alert severity="info">
        {t('The import was cancelled after {done} of {total} rows.', values)}
      </Alert>
    );
  }
  return null;
}

/** Step 5: what happened, and the rows to fix. */
export function ResultStep({ state, onDownloadIssues }: Readonly<ResultStepProps>) {
  const t = useT();
  const failed = state.issues.filter((issue) => !issue.skipped).length;
  const listed = state.issues.slice(0, LISTED_ISSUES);
  return (
    <Stack spacing={2}>
      <StopNotice state={state} />
      <Stack direction="row" spacing={4} useFlexGap sx={{ flexWrap: 'wrap' }} role="status">
        <Count label={t('Created')} value={state.created} />
        <Count label={t('Updated')} value={state.updated} />
        <Count label={t('Skipped')} value={state.skipped} />
        <Count label={t('Failed')} value={failed} />
      </Stack>
      {state.issues.length > 0 && (
        <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onDownloadIssues}>
            {t('Download issues CSV')}
          </Button>
          <List dense aria-label={t('Import issues')}>
            {listed.map((issue) => (
              <ListItem key={`${issue.row}:${issue.message}`} disableGutters>
                <ListItemText
                  primary={t('Line {line}', { line: issue.row })}
                  secondary={issue.message}
                />
              </ListItem>
            ))}
          </List>
          {state.issues.length > LISTED_ISSUES && (
            <Text size="sm" color="text.secondary">
              {t('{count} more in the issues CSV.', {
                count: state.issues.length - LISTED_ISSUES,
              })}
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}
