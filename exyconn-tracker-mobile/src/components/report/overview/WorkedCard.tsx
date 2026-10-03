import { XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { formatHoursMinutes, relativeChange, type PeriodTotals } from '@exyconn/tracker-core';
import { GradientBar } from '../../charts/GradientBar';
import { Surface } from '../../ui/Surface';
import { Body, Caption, Figure } from '../../ui/Typography';
import { ChangeBadge } from './ChangeBadge';

interface WorkedProps {
  current: PeriodTotals;
  previous: PeriodTotals;
  before: string;
}

/** The period's worked time, how active it was, and how it moved against the period before. */
export function WorkedCard({ current, previous, before }: Readonly<WorkedProps>) {
  const t = useT();
  const change = relativeChange(current.activeMs, previous.activeMs);
  return (
    <Surface>
      <Body color="$muted" fontWeight="600">
        {t('Worked')}
      </Body>
      <XStack alignItems="center" gap="$2">
        <Figure>{formatHoursMinutes(current.activeMs)}</Figure>
        {change === null ? null : <ChangeBadge change={change} />}
      </XStack>
      <GradientBar
        percent={current.activityPercent}
        label={t('Active')}
        trailing={t('{time} idle', { time: formatHoursMinutes(current.idleMs) })}
        accessibilityLabel={t('{percent}% of tracked time was active', {
          percent: current.activityPercent,
        })}
      />
      <Caption>
        {t('{time} {before}.', {
          time: formatHoursMinutes(previous.activeMs),
          before: t(before),
        })}
      </Caption>
    </Surface>
  );
}
