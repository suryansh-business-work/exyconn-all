import { useT } from '@exyconn/i18n';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import { CircularProgress, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import type { SaveStatus as Status } from './useCampaignDraft';

interface SaveStatusProps {
  status: Status;
  error: string | null;
  dirty: boolean;
}

/** Saving… / Saved / Not saved, announced politely to screen readers as it changes. */
export function SaveStatus({ status, error, dirty }: Readonly<SaveStatusProps>) {
  const t = useT();
  let icon = null;
  let label = dirty ? 'Unsaved changes' : 'Draft not saved yet — add a name';
  if (status === 'saving') {
    icon = <CircularProgress size={14} aria-hidden />;
    label = 'Saving…';
  } else if (status === 'failed') {
    icon = <ErrorOutlineIcon fontSize="small" color="error" aria-hidden />;
    label = 'Save failed';
  } else if (status === 'saved' && !dirty) {
    icon = <CheckCircleOutlinedIcon fontSize="small" color="success" aria-hidden />;
    label = 'All changes saved';
  }
  const text = (
    <Flex direction="row" alignItems="center" gap={0.5} role="status" aria-live="polite">
      {icon}
      <Text size="sm" color={status === 'failed' ? 'error' : 'text.secondary'}>
        {t(label)}
      </Text>
    </Flex>
  );
  return error ? <Tooltip title={t(error)}>{text}</Tooltip> : text;
}
