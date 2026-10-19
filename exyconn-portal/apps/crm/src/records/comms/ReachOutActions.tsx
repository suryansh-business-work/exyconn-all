import { useT } from '@exyconn/i18n';
import { Box, Stack, Text } from '@exyconn/shell/components/ui';
import { useCrmIntegrationStatusQuery } from '@exyconn/shell/graphql/generated';
import { openComms, type CommsChannel, type CommsRequest } from './commsStore';
import { ReachOutButton } from './ReachOutButton';

/** The record a Reach out row is for, with every number and address on it. */
export type ReachOutRecord = Omit<CommsRequest, 'channel'>;

interface ReachOutActionsProps {
  record: ReachOutRecord;
  /** Called before a panel opens, e.g. to close a modal quick view so the dock can be used. */
  onOpen?: () => void;
}

const CHANNEL_ORDER: readonly CommsChannel[] = ['CALL', 'SMS', 'EMAIL'];

/** Why a channel cannot be used: no provider yet, or nothing on the record to reach. */
function blockedReason(ready: boolean, reachable: boolean, notReady: string, missing: string) {
  if (!ready) {
    return notReady;
  }
  return reachable ? undefined : missing;
}

/**
 * Call, SMS and Email for a contact or company. Each opens a panel in the communication dock,
 * and is turned off (with the reason in its tooltip) until CRM > Integrations has the channel
 * connected and the record has a number or address.
 */
export function ReachOutActions({ record, onOpen }: Readonly<ReachOutActionsProps>) {
  const t = useT();
  const { data } = useCrmIntegrationStatusQuery();
  const status = data?.crmIntegrationStatus;
  const hasPhone = record.phones.length > 0;
  const reasons: Record<CommsChannel, string | undefined> = {
    CALL: blockedReason(
      status?.call.ready ?? false,
      hasPhone,
      'Connect a call provider in CRM > Integrations',
      'Add a phone number to this record to call it',
    ),
    SMS: blockedReason(
      status?.sms.ready ?? false,
      hasPhone,
      'Connect an SMS provider in CRM > Integrations',
      'Add a phone number to this record to text it',
    ),
    EMAIL: blockedReason(
      Boolean(status?.email.gmail || status?.email.microsoft),
      record.emails.length > 0,
      'Connect a Gmail or Microsoft mailbox in CRM > Integrations',
      'Add an email address to this record to email it',
    ),
  };
  const open = (channel: CommsChannel) => {
    onOpen?.();
    openComms({ ...record, channel });
  };
  return (
    <Stack spacing={1} role="group" aria-labelledby={`reach-out-${record.id}`}>
      <Text id={`reach-out-${record.id}`} component="h2" size="label" weight="bold">
        {t('Reach out')}
      </Text>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: (theme) => `repeat(auto-fit, minmax(${theme.spacing(12)}, 1fr))`,
        }}
      >
        {CHANNEL_ORDER.map((channel) => (
          <ReachOutButton
            key={channel}
            channel={channel}
            blockedReason={reasons[channel]}
            onClick={() => open(channel)}
          />
        ))}
      </Box>
    </Stack>
  );
}
