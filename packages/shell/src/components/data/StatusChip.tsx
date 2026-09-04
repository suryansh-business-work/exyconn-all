import { Chip } from '@/components/ui';

const COLOR_MAP: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> =
  {
    ACTIVE: 'success',
    PAID: 'success',
    APPROVED: 'success',
    SUCCEEDED: 'success',
    WON: 'success',
    RESOLVED: 'success',
    COMPLETED: 'success',
    PENDING: 'warning',
    QUEUED: 'warning',
    DRAFT: 'warning',
    ON_LEAVE: 'warning',
    PAUSED: 'warning',
    // Employee workspace: payslip, support ticket & priority states.
    GENERATED: 'info',
    OPEN: 'info',
    IN_PROGRESS: 'warning',
    CLOSED: 'default',
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'info',
    PRESENT: 'success',
    WFH: 'info',
    HALF_DAY: 'warning',
    ABSENT: 'error',
    OVERDUE: 'error',
    FAILED: 'error',
    REJECTED: 'error',
    TERMINATED: 'error',
    CRITICAL: 'error',
    EXPIRED: 'error',
    LOST: 'error',
    BLOCKED: 'error',
    INACTIVE: 'default',
    // Website module: form-submission triage & gig states (stored lowercase/kebab).
    NEW: 'info',
    IN_REVIEW: 'warning',
    ARCHIVED: 'default',
    CANCELLED: 'error',
    // Tech > Infrastructure: Docker container and health states.
    RUNNING: 'success',
    HEALTHY: 'success',
    RESTARTING: 'warning',
    STARTING: 'warning',
    EXITED: 'default',
    UNHEALTHY: 'error',
    DEAD: 'error',
    NONE: 'default',
  };

/** Renders an enum status value as a color-coded MUI chip. */
export function StatusChip({ value }: { value: string }) {
  // Website statuses are lowercase kebab ("in-review"); portal enums are SCREAMING_SNAKE.
  // Normalize before lookup so both colour-code off the same map.
  const key = value.toUpperCase().replaceAll('-', '_');

  return (
    <Chip
      label={value.replaceAll('_', ' ')}
      size="small"
      color={COLOR_MAP[key] ?? 'default'}
      variant="filled"
    />
  );
}
