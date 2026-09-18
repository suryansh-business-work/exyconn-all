import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Grid, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  useItDisableLeaverAccountMutation,
  useItOffboardingQuery,
  useItRevokeAllAccessMutation,
} from '@exyconn/shell/graphql/generated';
import { useRunAction } from '../../hooks/useRunAction';
import { LeaverCard, type LeaverRow } from './LeaverCard';

/**
 * IT › Employee Offboarding: disable accounts, revoke access, recover devices, confirm the data
 * handover. Exits are HR's. IT may disable only a leaver's account — never an administrator's —
 * and the server holds it to that; anyone else is deactivated in Admin.
 */
export function OffboardingPage() {
  const t = useT();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useItOffboardingQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [revokeAll] = useItRevokeAllAccessMutation();
  const [disableAccount] = useItDisableLeaverAccountMutation();
  const runAction = useRunAction(refetch);
  const leavers = data?.itOffboarding ?? [];

  const busyWhile = async (leaver: LeaverRow, action: () => Promise<unknown>, done: string) => {
    setBusyId(leaver.exitId);
    await runAction(action, done);
    setBusyId(null);
  };

  const disable = async (leaver: LeaverRow) => {
    const ok = await confirm({
      message: 'Disable {name}? They will be signed out and unable to sign in.',
      messageValues: { name: leaver.employeeName },
      confirmText: 'Disable account',
    });
    if (ok) {
      await busyWhile(
        leaver,
        () => disableAccount({ variables: { employeeId: leaver.employeeId } }),
        'Account disabled',
      );
    }
  };

  let body = <Text color="text.secondary">{t('Nobody is leaving right now.')}</Text>;
  if (error) {
    body = <Text color="error">{error.message}</Text>;
  } else if (loading && leavers.length === 0) {
    body = <Text color="text.secondary">{t('Loading…')}</Text>;
  } else if (leavers.length > 0) {
    body = (
      <Grid container spacing={1.5}>
        {leavers.map((leaver) => (
          <Grid key={leaver.exitId} size={{ xs: 12, md: 6 }}>
            <LeaverCard
              leaver={leaver}
              busy={busyId === leaver.exitId}
              onRevokeAll={() =>
                busyWhile(
                  leaver,
                  () => revokeAll({ variables: { employeeId: leaver.employeeId } }),
                  'Revocations requested — carry them out in Access Management',
                )
              }
              onDisable={() => {
                disable(leaver).catch((reason: unknown) =>
                  console.error('Could not disable the account', reason),
                );
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Employee Offboarding"
        subtitle="Disable accounts, revoke access, recover devices and hand over data"
      />
      {body}
    </Box>
  );
}
