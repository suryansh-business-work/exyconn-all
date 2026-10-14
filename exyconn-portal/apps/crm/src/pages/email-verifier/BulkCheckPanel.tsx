import { useEffect, useState, type ChangeEvent } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  EmailVerificationBatchStatus,
  useCreateEmailVerificationBatchMutation,
  useEmailVerificationBatchesQuery,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { BatchList } from './BatchList';
import { emailsInCsv } from './csvEmails';

/** How often the list refreshes while a bulk check is still running. */
const POLL_MS = 5000;

const WORKING = new Set([
  EmailVerificationBatchStatus.Queued,
  EmailVerificationBatchStatus.Running,
]);

/** Upload a CSV of addresses; they are checked in the background and land in Records. */
export function BulkCheckPanel() {
  const t = useT();
  const notify = useNotify();
  const [error, setError] = useState<string | null>(null);
  const { data, startPolling, stopPolling, refetch } = useEmailVerificationBatchesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [createBatch, { loading }] = useCreateEmailVerificationBatchMutation();
  const batches = data?.emailVerificationBatches ?? [];
  const working = batches.some((batch) => WORKING.has(batch.status));

  useEffect(() => {
    if (working) {
      startPolling(POLL_MS);
    }
    return stopPolling;
  }, [working, startPolling, stopPolling]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setError(null);
    const emails = emailsInCsv(await file.text());
    if (emails.length === 0) {
      setError(t('No email addresses were found in {file}.', { file: file.name }));
      return;
    }
    try {
      await createBatch({ variables: { name: file.name, emails } });
      notify('{count} addresses queued for checking', 'success', { count: emails.length });
      await refetch();
    } catch (failure) {
      setError(errorMessage(failure, t('Could not start the bulk check')));
    }
  };

  return (
    <Stack spacing={2}>
      <Text color="text.secondary">
        {t(
          'Upload a CSV: every email address in it is found, whatever the column, and checked in the background — up to 5,000 per file.',
        )}
      </Text>
      <div>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={loading}
        >
          {loading ? t('Uploading…') : t('Upload CSV')}
          <input hidden type="file" accept=".csv,text/csv,.txt,text/plain" onChange={upload} />
        </Button>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <BatchList batches={batches} />
    </Stack>
  );
}
