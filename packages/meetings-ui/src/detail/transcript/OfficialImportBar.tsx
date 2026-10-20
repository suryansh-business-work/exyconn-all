import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  useMaImportOfficialTranscriptMutation,
  type MaStepStatus,
} from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';

interface OfficialImportBarProps {
  meetingId: string;
  status: MaStepStatus;
}

/** Where the official Google Meet transcript import stands, and a button to fetch it again. */
export function OfficialImportBar({ meetingId, status }: Readonly<OfficialImportBarProps>) {
  const t = useT();
  const [importTranscript] = useMaImportOfficialTranscriptMutation();
  const runNotified = useRunNotified();
  const [busy, setBusy] = useState(false);
  const runImport = async () => {
    setBusy(true);
    await runNotified(
      () => importTranscript({ variables: { meetingId } }),
      'Google Meet transcript import started',
    );
    setBusy(false);
  };
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Text size="sm" color="text.secondary">
        {t('Official Google Meet transcript')}
      </Text>
      <StatusChip value={status} />
      <Button size="small" startIcon={<CloudDownloadIcon />} onClick={runImport} loading={busy}>
        {t('Import from Google Meet')}
      </Button>
    </Flex>
  );
}
