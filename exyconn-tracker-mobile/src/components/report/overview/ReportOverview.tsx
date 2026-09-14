import { Pressable } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import {
  formatCount,
  formatDayLabel,
  formatHoursMinutes,
  relativeChange,
  type PeriodLength,
  type PeriodTotals,
} from '@exyconn/tracker-core';
import type { PeriodInsights } from '../../../hooks/usePeriodInsights';
import { useBrand } from '../../../theme/BrandProvider';
import { borderWidth, radius, trackerSelected } from '../../../theme/tokens';
import { ActivityCard } from '../../charts/ActivityCard';
import { GradientBar } from '../../charts/GradientBar';
import { StripesChart } from '../../charts/StripesChart';
import type { IconName } from '../../ui/Icon';
import { Notice } from '../../ui/Notice';
import { Surface } from '../../ui/Surface';
import { Body, Caption, Figure } from '../../ui/Typography';
import { SkeletonBlock } from '../SkeletonBlock';
import { ChangeBadge } from './ChangeBadge';
import { MetricCard } from './MetricCard';

const PERIODS: ReadonlyArray<{ length: PeriodLength; label: string; before: string }> = [
  { length: 7, label: 'Last 7 days', before: 'the 7 days before' },
  { length: 30, label: 'Last 30 days', before: 'the 30 days before' },
];

type CountKey = 'keyCount' | 'mouseCount' | 'sessions' | 'trackedDays';

const METRICS: ReadonlyArray<{ key: CountKey; label: string; icon: IconName }> = [
  { key: 'keyCount', label: 'Keystrokes', icon: 'keyboard-outline' },
  { key: 'mouseCount', label: 'Mouse clicks', icon: 'mouse' },
  { key: 'sessions', label: 'Sessions', icon: 'timer-outline' },
  { key: 'trackedDays', label: 'Days tracked', icon: 'calendar-check-outline' },
];

/** The chips are at least 40 tall; the slop brings the touch target to the platform's 44. */
const CHIP_SLOP = { top: 2, bottom: 2 } as const;

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** One period chip — the inverted pill when it is the one showing. */
function PeriodChip({ label, selected, onPress }: Readonly<ChipProps>) {
  const { scheme } = useBrand();
  const pill = trackerSelected[scheme];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={CHIP_SLOP}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
    >
      <XStack
        minHeight={40}
        paddingHorizontal="$4"
        alignItems="center"
        borderRadius={radius.pill}
        borderWidth={selected ? 0 : borderWidth.hairline}
        borderColor="$hairline"
        backgroundColor={selected ? pill.fill : '$paper'}
      >
        <Body fontWeight="600" color={selected ? pill.ink : '$ink'}>
          {label}
        </Body>
      </XStack>
    </Pressable>
  );
}

interface WorkedProps {
  current: PeriodTotals;
  previous: PeriodTotals;
  before: string;
}

/** The period's worked time, how active it was, and how it moved against the period before. */
function WorkedCard({ current, previous, before }: Readonly<WorkedProps>) {
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

interface Props {
  length: PeriodLength;
  onLengthChange: (length: PeriodLength) => void;
  insights: PeriodInsights;
}

/**
 * The report's first tab: the last 7 or 30 days at a glance — worked time, a day-by-day
 * stripes chart, and the counts — each against the equally long period before it. The
 * desktop's Overview; a period with nothing before it shows no change rather than an invented one.
 */
export function ReportOverview({ length, onLengthChange, insights }: Readonly<Props>) {
  const t = useT();
  const period = PERIODS.find((entry) => entry.length === length) ?? PERIODS[0];
  const { range, current, previous, columns, loading, error } = insights;
  const first = range.current[0];
  const last = range.current.at(-1) ?? first;
  const middle = range.current[Math.floor(range.current.length / 2)];

  return (
    <YStack gap="$4">
      <XStack gap="$2" accessibilityRole="radiogroup" accessibilityLabel={t('Period')}>
        {PERIODS.map((entry) => (
          <PeriodChip
            key={entry.length}
            label={t(entry.label)}
            selected={entry.length === length}
            onPress={() => onLengthChange(entry.length)}
          />
        ))}
      </XStack>

      {error === null ? null : <Notice severity="error">{error}</Notice>}

      {loading ? (
        <SkeletonBlock height={180} />
      ) : (
        <WorkedCard current={current} previous={previous} before={period.before} />
      )}

      <ActivityCard title={t('Over time')} percent={loading ? null : current.activityPercent}>
        <StripesChart
          bars={columns}
          labels={{
            start: formatDayLabel(first),
            middle: formatDayLabel(middle),
            end: formatDayLabel(last),
          }}
          summary={t('Hours worked per day, {period}; {days} days tracked.', {
            period: t(period.label).toLowerCase(),
            days: current.trackedDays,
          })}
        />
        <Caption>
          {t('Each stripe is a day: its height is the time worked, its colour how active it was.')}
        </Caption>
      </ActivityCard>

      <XStack flexWrap="wrap" gap="$3">
        {METRICS.map((metric) => (
          <YStack key={metric.key} width="47%" flexGrow={1}>
            <MetricCard
              label={t(metric.label)}
              icon={metric.icon}
              value={formatCount(current[metric.key])}
              change={relativeChange(current[metric.key], previous[metric.key])}
              caption={t('{count} {before}', {
                count: formatCount(previous[metric.key]),
                before: t(period.before),
              })}
            />
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
}
