import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { formatDateTime, formatHoursMinutes, type ManualEntry } from '@exyconn/tracker-core';
import { ENTRY_STATUS, bookedTo } from '../../lib/off-computer/entry-status';
import { AppButton } from '../ui/AppButton';
import { Chip } from '../ui/Chip';
import { Body, Caption, Heading } from '../ui/Typography';

interface Props {
  entry: ManualEntry;
  timezone: string;
  onWithdraw: (entry: ManualEntry) => void;
}

/**
 * One claim: how long, when, against what, why — and where it stands. Only a pending claim
 * can be taken back; a decided one belongs to the timesheet and the reviewer who made it.
 */
export function ManualEntryRow({ entry, timezone, onWithdraw }: Readonly<Props>) {
  const t = useT();
  const status = ENTRY_STATUS[entry.status];
  const span = t('{start} — {end}', {
    start: formatDateTime(entry.startedAt, timezone),
    end: formatDateTime(entry.endedAt, timezone),
  });

  return (
    <YStack gap="$1.5">
      <XStack justifyContent="space-between" alignItems="center" gap="$2">
        <Heading>{formatHoursMinutes(entry.durationMs)}</Heading>
        <Chip label={t(status.label)} tone={status.tone} icon={status.icon} />
      </XStack>
      <Caption>{span}</Caption>
      <Caption>{bookedTo(entry)}</Caption>
      <Body>{entry.note}</Body>
      {entry.reviewNote === '' ? null : (
        <Caption>{t('Reviewer: {note}', { note: entry.reviewNote })}</Caption>
      )}
      {entry.status === 'PENDING' ? (
        <XStack justifyContent="flex-end">
          <AppButton
            label={t('Withdraw')}
            tone="text"
            danger
            accessibilityLabel={t('Withdraw the claim for {duration}', {
              duration: formatHoursMinutes(entry.durationMs),
            })}
            onPress={() => onWithdraw(entry)}
          />
        </XStack>
      ) : null}
    </YStack>
  );
}
