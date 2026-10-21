import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  MaEmailStatus,
  useMaEmailDeliveriesQuery,
  useMaSendSummaryEmailMutation,
  type MaMeetingDetailFragment,
} from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';
import { useRunNotified } from '../../lib/useRunNotified';
import { EmailDeliveries } from './EmailDeliveries';
import { EmailPreviewDialog } from './EmailPreviewDialog';

/** The summary email: where it stands, a preview, sending (or approving) it, and every delivery. */
export function EmailTab({ meeting }: Readonly<{ meeting: MaMeetingDetailFragment }>) {
  const t = useT();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const [previewing, setPreviewing] = useState(false);
  const [sendEmail, { loading: sending }] = useMaSendSummaryEmailMutation();
  const { data, loading, error, refetch } = useMaEmailDeliveriesQuery({
    variables: { meetingId: meeting.id },
    fetchPolicy: 'cache-and-network',
  });
  const awaitingApproval = meeting.emailStatus === MaEmailStatus.AwaitingApproval;
  const sendLabel = awaitingApproval ? 'Approve and send' : 'Send summary email';

  const send = async () => {
    const ok = await confirm({
      title: sendLabel,
      message: 'Email the current notes to every recipient who has not had this version yet?',
      confirmText: 'Send',
    });
    if (!ok) {
      return;
    }
    await runNotified(
      () =>
        sendEmail({
          variables: { meetingId: meeting.id },
          refetchQueries: ['MaEmailDeliveries'],
        }),
      'Summary email queued',
    );
  };

  return (
    <Box sx={panel}>
      <Flex
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2 }}
      >
        <Text size="sm" color="text.secondary">
          {t('Email status')}
        </Text>
        <StatusChip value={meeting.emailStatus} />
        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewing(true)}>
          {t('Preview')}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          onClick={send}
          loading={sending}
        >
          {t(sendLabel)}
        </Button>
      </Flex>
      {error ? (
        <LoadError message={error.message} onRetry={() => refetch()} />
      ) : (
        <EmailDeliveries
          deliveries={data?.maEmailDeliveries ?? []}
          loading={loading && !data}
          onRefresh={() => refetch()}
        />
      )}
      <EmailPreviewDialog
        meetingId={meeting.id}
        open={previewing}
        onClose={() => setPreviewing(false)}
      />
    </Box>
  );
}
