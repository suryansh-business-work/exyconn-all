import { XStack, YStack } from 'tamagui';
import type { TrackerSettings } from '@exyconn/tracker-core';
import {
  NOTHING_WHEN_STOPPED,
  phoneRecords,
  type RecordLine,
} from '../../lib/capabilities/phone-records';
import { capabilities } from '../../tracker/platform';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

function RecordRow({ line }: Readonly<{ line: RecordLine }>) {
  const success = useThemeColor('success');
  const muted = useThemeColor('muted');
  const state = line.recorded ? 'Recorded' : 'Not recorded';
  return (
    <XStack
      gap="$3"
      alignItems="flex-start"
      accessible
      accessibilityLabel={`${line.title}: ${state}. ${line.detail}`}
    >
      <Icon
        name={line.recorded ? 'check-circle-outline' : 'close-circle-outline'}
        color={line.recorded ? success : muted}
      />
      <YStack flex={1} gap="$0.5">
        <Body fontWeight="600">{line.title}</Body>
        <Caption>{line.detail}</Caption>
      </YStack>
    </XStack>
  );
}

interface Props {
  settings: TrackerSettings | null;
}

/**
 * The app's own, plain account of what THIS phone records — on the consent screen beside the
 * workspace's disclosure, and in Settings. Includes what it does not record, because on a phone
 * that is most of the answer.
 */
export function PhoneRecordsList({ settings }: Readonly<Props>) {
  return (
    <YStack gap="$3">
      {phoneRecords(capabilities, settings).map((line) => (
        <RecordRow key={line.id} line={line} />
      ))}
      <Caption>{NOTHING_WHEN_STOPPED}</Caption>
    </YStack>
  );
}
