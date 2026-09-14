import { useT } from '@exyconn/i18n';
import { Box, LinearProgress, Typography } from '@exyconn/shell/components/ui';

const HOUR_MS = 3_600_000;

interface BudgetBarProps {
  /** Time logged in the window being looked at, tracked and off-computer together. */
  trackedMs: number;
  budgetHours: number;
}

/** Hours to one place: `12.5 h`. */
const hours = (ms: number): string => `${(ms / HOUR_MS).toFixed(1)} h`;

/**
 * Tracked time against the hours agreed for the project.
 *
 * Reads over budget as a red bar rather than clamping the number: the overrun is the fact
 * a project lead most needs to see, and a bar stuck at 100% hides it.
 */
export function BudgetBar({ trackedMs, budgetHours }: Readonly<BudgetBarProps>) {
  const t = useT();
  const used = trackedMs / (budgetHours * HOUR_MS);
  const over = used > 1;
  const color = over ? 'error' : 'primary';
  const tracked = hours(trackedMs);
  let summary = t('Tracked {tracked} of budget {budget} h', { tracked, budget: budgetHours });
  if (over) {
    summary = t('Tracked {tracked} of budget {budget} h — {excess} over', {
      tracked,
      budget: budgetHours,
      excess: hours(trackedMs - budgetHours * HOUR_MS),
    });
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {summary}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(used, 1) * 100}
        color={color}
        aria-label={t('Budget used')}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}
