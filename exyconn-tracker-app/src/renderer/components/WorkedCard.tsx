import type { ReactElement } from 'react';
import { letterSpacing, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { formatHoursMinutes, relativeChange, type PeriodTotals } from '@exyconn/tracker-core';
import ChangeBadge from './ChangeBadge';
import GradientBar from './GradientBar';
import Surface from './Surface';

/** The period's worked time, how active it was, and how both moved against the period before. */
export default function WorkedCard({
  current,
  previous,
  before,
}: Readonly<{ current: PeriodTotals; previous: PeriodTotals; before: string }>): ReactElement {
  const t = useT();
  const change = relativeChange(current.activeMs, previous.activeMs);
  return (
    <Surface sx={{ p: 2.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {t('Worked')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', my: 1 }}>
        <Typography
          variant="h3"
          component="p"
          sx={{ fontWeight: 700, letterSpacing: letterSpacing.tighter }}
        >
          {formatHoursMinutes(current.activeMs)}
        </Typography>
        {change === null ? null : <ChangeBadge change={change} />}
      </Stack>
      <GradientBar
        percent={current.activityPercent}
        label={t('Active')}
        trailing={t('{time} idle', { time: formatHoursMinutes(current.idleMs) })}
        ariaLabel={t('{percent}% of tracked time was active', {
          percent: current.activityPercent,
        })}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
        {t('{time} {before}.', { time: formatHoursMinutes(previous.activeMs), before: t(before) })}
      </Typography>
    </Surface>
  );
}
