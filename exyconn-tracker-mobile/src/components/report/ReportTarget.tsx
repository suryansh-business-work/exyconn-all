import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { formatHoursMinutes, targetFigures, type MonthTarget } from '@exyconn/tracker-core';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  target: MonthTarget;
  workHoursPerDay: number;
}

/**
 * The month against the employee's contract: expected hours (approved leave and holidays
 * already taken off), hours logged, the deficit so far — negative while behind — and the
 * leave taken. The desktop's summary, and the figures the portal shows their manager.
 */
export function ReportTarget({ target, workHoursPerDay }: Readonly<Props>) {
  const t = useT();
  const leave = t('{days} days (-{hours})', {
    days: target.leaveDates.size,
    hours: formatHoursMinutes(target.leaveMs),
  });
  return (
    <Surface padding="$4">
      <XStack flexWrap="wrap" rowGap="$3">
        {targetFigures(target, leave).map((item) => (
          <YStack
            key={item.id}
            width="50%"
            paddingRight="$2"
            accessible
            accessibilityLabel={t('{label}: {value}', { label: t(item.label), value: item.value })}
          >
            <Caption>{t(item.label)}</Caption>
            <Heading accessibilityRole="text" color={item.alert ? '$error' : '$ink'}>
              {item.value}
            </Heading>
          </YStack>
        ))}
      </XStack>
      <Caption>
        {t(
          '{hours}h a day on your work days, less holidays and approved leave. Ringed red days fell short.',
          { hours: workHoursPerDay },
        )}
      </Caption>
    </Surface>
  );
}
