import { ProjectRisk, ProjectTimeline } from '@exyconn/shell/graphql/generated';

/** MUI palette colours per risk. UNKNOWN is grey, not green — silence is not good news. */
export const RISK_COLOR: Record<ProjectRisk, 'success' | 'warning' | 'error' | 'default'> = {
  [ProjectRisk.Low]: 'success',
  [ProjectRisk.Medium]: 'warning',
  [ProjectRisk.High]: 'error',
  [ProjectRisk.Unknown]: 'default',
};

export const RISK_LABEL: Record<ProjectRisk, string> = {
  [ProjectRisk.Low]: 'On track',
  [ProjectRisk.Medium]: 'Watch',
  [ProjectRisk.High]: 'At risk',
  [ProjectRisk.Unknown]: 'Not measured',
};

export const TIMELINE_COLOR: Record<ProjectTimeline, 'success' | 'warning' | 'error' | 'default'> =
  {
    [ProjectTimeline.OnTrack]: 'success',
    [ProjectTimeline.Completed]: 'success',
    [ProjectTimeline.DueSoon]: 'warning',
    [ProjectTimeline.Overdue]: 'error',
    [ProjectTimeline.NoDates]: 'default',
  };

export const TIMELINE_LABEL: Record<ProjectTimeline, string> = {
  [ProjectTimeline.OnTrack]: 'On track',
  [ProjectTimeline.Completed]: 'Completed',
  [ProjectTimeline.DueSoon]: 'Due soon',
  [ProjectTimeline.Overdue]: 'Overdue',
  [ProjectTimeline.NoDates]: 'No end date',
};

/** A percentage, or the reason there isn't one. Never a fabricated zero. */
export function percentLabel(value: number | null | undefined, absent: string): string {
  if (value === null || value === undefined) return absent;
  return `${Math.round(value)}%`;
}
