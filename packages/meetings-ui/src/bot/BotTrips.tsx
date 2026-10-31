import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Box, Heading, Link } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  useMaBotDispatchesQuery,
  useMaCancelBotMutation,
  useMaSendBotMutation,
  type MaBotDispatchFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { SendBotForm, type SendBotValues } from '../forms/send-bot';
import { LoadError } from '../lib/LoadError';
import { useRunNotified } from '../lib/useRunNotified';
import { meetingPaths, toMaScope, type MeetingPageProps } from '../lib/scope';

type Trip = MaBotDispatchFieldsFragment;

/** Polls while a bot is on its way or in a call, so its status moves on its own. */
const LIVE_POLL_MS = 15_000;
const REFETCH = ['MaBotDispatches'];

/**
 * The meeting bot: send it into a Google Meet call, and follow the latest trips — queued,
 * waiting to be admitted, recording, or done (with a link to the meeting it recorded).
 */
export function BotTrips({ scope, basePath }: Readonly<MeetingPageProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const { data, loading, error, refetch } = useMaBotDispatchesQuery({
    variables: { scope: toMaScope(scope) },
    fetchPolicy: 'cache-and-network',
    pollInterval: LIVE_POLL_MS,
  });
  const [sendBot] = useMaSendBotMutation();
  const [cancelBot] = useMaCancelBotMutation();
  const paths = meetingPaths(basePath);

  const send = (values: SendBotValues) =>
    runNotified(
      () =>
        sendBot({
          variables: { meetUrl: values.meetUrl, title: values.title || null },
          refetchQueries: REFETCH,
        }),
      'The bot is on its way to the call',
    );

  const callBack = async (trip: Trip) => {
    const ok = await confirm({
      title: 'Call the bot back?',
      message: 'The bot leaves {code}; what it recorded so far is kept.',
      messageValues: { code: trip.meetingCode },
      confirmText: 'Call back',
      destructive: true,
    });
    if (ok) {
      await runNotified(
        () => cancelBot({ variables: { id: trip.id }, refetchQueries: REFETCH }),
        'The bot was called back',
      );
    }
  };

  const columns: Column<Trip>[] = [
    { key: 'meetingCode', label: 'Call', render: (row) => row.title || row.meetingCode },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'source', label: 'Sent by', render: (row) => <StatusChip value={row.source} /> },
    ...(scope === 'ALL' ? [{ key: 'ownerName', label: 'Owner' } as Column<Trip>] : []),
    { key: 'joinAt', label: 'Joins at', render: (row) => formatDateTime(row.joinAt) },
    {
      key: 'meetingId',
      label: 'Meeting',
      render: (row) =>
        row.meetingId ? (
          <Link component={RouterLink} to={paths.detail(row.meetingId)}>
            {t('Open')}
          </Link>
        ) : (
          row.error || '—'
        ),
    },
  ];
  const actions: RowAction<Trip>[] = [
    {
      icon: <CallEndIcon fontSize="small" />,
      tooltip: 'Call back',
      ariaLabel: 'Call the bot back',
      color: 'error',
      hidden: (row) => Boolean(row.finishedAt),
      onClick: callBack,
    },
  ];

  return (
    <Box sx={panel}>
      <Heading level={2} sx={{ typography: 'h6', mb: 1 }}>
        {t('Meeting bot')}
      </Heading>
      <SendBotForm onSubmit={send} />
      <Box sx={{ mt: 2 }}>
        {error ? (
          <LoadError message={error.message} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={data?.maBotDispatches ?? []}
            actions={actions}
            loading={loading && !data}
            onRefresh={() => refetch()}
            emptyMessage="The bot has not been sent into a call yet."
          />
        )}
      </Box>
    </Box>
  );
}
