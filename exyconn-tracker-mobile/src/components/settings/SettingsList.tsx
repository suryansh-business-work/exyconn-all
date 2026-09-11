import { Separator, XStack, YStack } from 'tamagui';
import type { PhoneSettingRow } from '../../lib/settings/phone-notes';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface Props {
  rows: readonly PhoneSettingRow[];
}

function Row({ row }: Readonly<{ row: PhoneSettingRow }>) {
  return (
    <YStack paddingVertical="$2.5" gap="$1.5">
      {/* Wraps instead of overlapping: a value that cannot fit beside its label drops to the
          next line, so a sentence-long value (the webcam corner, the tracking window) stays
          readable on a narrow phone. */}
      <XStack flexWrap="wrap" justifyContent="space-between" alignItems="baseline" gap="$3">
        <Caption flexShrink={0}>{row.label}</Caption>
        <Body size="$3" fontWeight="600" flexGrow={1} flexShrink={1} textAlign="right">
          {row.value}
        </Body>
      </XStack>
      {row.note === undefined ? null : (
        <XStack gap="$1.5" alignItems="flex-start">
          <Icon name="cellphone-information" size={16} />
          <Caption flex={1}>{row.note}</Caption>
        </XStack>
      )}
    </YStack>
  );
}

/**
 * Read-only label/value list — the workspace's tracker settings, or HR's working day. Both
 * halves of a row are in normal flow, and a row this phone cannot honour carries its note
 * underneath rather than implying the setting is being applied.
 */
export function SettingsList({ rows }: Readonly<Props>) {
  return (
    <YStack>
      {rows.map((row, position) => (
        <YStack key={row.id}>
          {position === 0 ? null : <Separator borderColor="$hairline" />}
          <Row row={row} />
        </YStack>
      ))}
    </YStack>
  );
}
