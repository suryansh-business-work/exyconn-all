import { useT } from '@exyconn/i18n';
import { MARK_WORDS } from '@exyconn/tracker-core';
import { Box } from '@/components/ui';
import type { TrackerDayMark } from './tracker.types';
import { STATUS_ICONS, useStatusColors } from './tracker.status';

/** A day's status as a small pill in its own colour, with its icon and word. */
export function TrackerStatusChip({ status }: Readonly<{ status: TrackerDayMark }>) {
  const t = useT();
  const { hue, tint } = useStatusColors()(status);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        border: 1,
        borderColor: hue,
        bgcolor: tint,
        typography: 'caption',
        fontWeight: 'fontWeightMedium',
      }}
    >
      <Box component="span" aria-hidden sx={{ display: 'flex', color: hue }}>
        {STATUS_ICONS[status]}
      </Box>
      {t(MARK_WORDS[status])}
    </Box>
  );
}
