import { XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { DayMark } from '@exyconn/tracker-core';
import { MARK_ORDER, MARK_WORDS } from '../../lib/report/day-marks';
import { radius } from '../../theme/tokens';
import { Caption } from '../ui/Typography';

const SWATCH = 12;

interface Props {
  markColors: Readonly<Record<DayMark, string>>;
}

/** What each ring on the calendar means — the words say it as well as the colours. */
export function CalendarLegend({ markColors }: Readonly<Props>) {
  const t = useT();
  return (
    <XStack gap="$3" flexWrap="wrap" justifyContent="center">
      {MARK_ORDER.map((mark) => (
        <XStack key={mark} gap="$1.5" alignItems="center">
          <XStack
            width={SWATCH}
            height={SWATCH}
            borderRadius={radius.pill}
            borderWidth={2}
            borderColor={markColors[mark]}
          />
          <Caption>{t(MARK_WORDS[mark])}</Caption>
        </XStack>
      ))}
    </XStack>
  );
}
