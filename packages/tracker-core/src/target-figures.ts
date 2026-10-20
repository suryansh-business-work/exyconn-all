import { formatSignedHoursMinutes, type MonthTarget } from './expected-hours';
import { formatHoursMinutes } from './format';

/** One figure of the month against its contract. */
export interface TargetFigure {
  id: string;
  /** English source; the screen translates it. */
  label: string;
  value: string;
  /** The deficit while behind: said in red as well as with its minus sign. */
  alert: boolean;
}

/**
 * Expected, logged, the deficit so far and the leave taken — the four figures both apps show
 * above the month. `leave` is already worded ("3 days (-24h 0m)"), since it needs `t`.
 */
export function targetFigures(target: MonthTarget, leave: string): TargetFigure[] {
  return [
    {
      id: 'expected',
      label: 'Expected this month',
      value: formatHoursMinutes(target.expectedMs),
      alert: false,
    },
    {
      id: 'logged',
      label: 'Logged this month',
      value: formatHoursMinutes(target.workedMs),
      alert: false,
    },
    {
      id: 'deficit',
      label: 'Deficit so far',
      value: formatSignedHoursMinutes(target.deficitMs),
      alert: target.deficitMs < 0,
    },
    { id: 'leave', label: 'Leave this month', value: leave, alert: false },
  ];
}
