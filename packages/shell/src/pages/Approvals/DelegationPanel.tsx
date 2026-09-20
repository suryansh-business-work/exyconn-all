import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Heading, Text } from '@/components/ui';
import { densePanel } from '@/components/glass/glass';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSettings } from '@/hooks/useSettings';
import { errorMessage } from '@/utils/errorMessage';
import {
  useMyApprovalDelegationsQuery,
  useEndApprovalDelegationMutation,
  type MyApprovalDelegationsQuery,
} from '@/graphql/generated';
import { DelegateApprovalsForm } from './forms/delegate';

type Given = MyApprovalDelegationsQuery['myApprovalDelegations']['given'][number];
type Held = MyApprovalDelegationsQuery['myApprovalDelegations']['held'][number];

interface RowProps {
  who: string;
  from: string;
  to: string;
  active: boolean;
  note: string;
  formatDate: (value: string | null | undefined) => string;
  onEnd?: () => void;
}

/** One arrangement, from either side. */
function DelegationRow({ who, from, to, active, note, formatDate, onEnd }: Readonly<RowProps>) {
  const t = useT();
  return (
    <Flex
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}
    >
      <Box>
        <Flex direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Text size="sm">{who}</Text>
          {active && <Chip size="small" label={t('Now')} color="success" />}
        </Flex>
        <Text size="caption" color="text.secondary">
          {t('{from} to {to}', { from: formatDate(from), to: formatDate(to) })}
          {note ? ` · ${note}` : ''}
        </Text>
      </Box>
      {onEnd && (
        <Button size="small" variant="outlined" onClick={onEnd}>
          {t('End')}
        </Button>
      )}
    </Flex>
  );
}

/**
 * Who is covering your approvals, and whose you are covering.
 *
 * A manager on two weeks' leave was a two-week hold on every request behind them, and the
 * workaround people actually reach for is sharing a password.
 */
export function DelegationPanel() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const [arranging, setArranging] = useState(false);
  const { data, refetch } = useMyApprovalDelegationsQuery({ fetchPolicy: 'cache-and-network' });
  const [end] = useEndApprovalDelegationMutation();
  const given: Given[] = data?.myApprovalDelegations.given ?? [];
  const held: Held[] = data?.myApprovalDelegations.held ?? [];

  const endOne = async (row: Given) => {
    const ok = await confirm({
      title: 'End this cover?',
      message: '{name} stops seeing your approvals immediately.',
      messageValues: { name: row.toName },
      confirmText: 'End cover',
    });
    if (!ok) {
      return;
    }
    try {
      await end({ variables: { id: row.id } });
      await refetch();
      notify(t('That cover has ended.'), 'success');
    } catch (err) {
      notify(errorMessage(err, t('It could not be ended.')), 'error');
    }
  };

  const done = async () => {
    setArranging(false);
    await refetch();
  };

  return (
    <Box sx={densePanel}>
      <Flex
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Heading level={6}>{t('While you are away')}</Heading>
        {!arranging && (
          <Button size="small" variant="outlined" onClick={() => setArranging(true)}>
            {t('Arrange cover')}
          </Button>
        )}
      </Flex>

      {arranging ? (
        <DelegateApprovalsForm onDone={done} onCancel={() => setArranging(false)} />
      ) : (
        <Box>
          {held.some((row) => row.active) && (
            <Alert severity="info" sx={{ my: 1 }}>
              {t('You are covering approvals for somebody else, shown in the queue above.')}
            </Alert>
          )}
          {given.length === 0 && held.length === 0 && (
            <Text size="sm" color="text.secondary">
              {t('Nobody is covering your approvals, and you are not covering anybody.')}
            </Text>
          )}
          {given.map((row) => (
            <DelegationRow
              key={row.id}
              who={t('{name} covers you', { name: row.toName })}
              from={row.fromDate}
              to={row.toDate}
              active={row.active}
              note={row.note}
              formatDate={formatDate}
              onEnd={() => endOne(row)}
            />
          ))}
          {held.map((row) => (
            <DelegationRow
              key={row.id}
              who={t('You cover {name}', { name: row.fromName })}
              from={row.fromDate}
              to={row.toDate}
              active={row.active}
              note={row.note}
              formatDate={formatDate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
