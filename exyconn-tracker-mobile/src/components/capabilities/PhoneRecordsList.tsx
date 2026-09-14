import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
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
  const t = useT();
  const success = useThemeColor('success');
  const muted = useThemeColor('muted');
  const state = line.recorded ? t('Recorded') : t('Not recorded');
  const title = t(line.title);
  const detail = t(line.detail);
  return (
    <XStack
      gap="$3"
      alignItems="flex-start"
      accessible
      accessibilityLabel={t('{title}: {state}. {detail}', { title, state, detail })}
    >
      <Icon
        name={line.recorded ? 'check-circle-outline' : 'close-circle-outline'}
        color={line.recorded ? success : muted}
      />
      <YStack flex={1} gap="$0.5">
        <Body fontWeight="600">{title}</Body>
        <Caption>{detail}</Caption>
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
  const t = useT();
  return (
    <YStack gap="$3">
      {phoneRecords(capabilities, settings).map((line) => (
        <RecordRow key={line.id} line={line} />
      ))}
      <Caption>{t(NOTHING_WHEN_STOPPED)}</Caption>
    </YStack>
  );
}
