import type { ReactElement } from 'react';
import { alpha, Box, iconSize, letterSpacing, Stack, Typography } from '@exyconn/ui';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ChangeLabel } from '@exyconn/tracker-core';
import ChangeBadge from './ChangeBadge';
import Surface from './Surface';

interface Props {
  label: string;
  value: string;
  /** Against the period before; null when that period had nothing to compare. */
  change: ChangeLabel | null;
  /** The earlier period's figure, in words — "412 the week before". */
  caption: string;
  icon: SvgIconComponent;
}

/** One figure for the period: its name and icon, the number, and how it moved. */
export default function MetricCard({
  label,
  value,
  change,
  caption,
  icon: Icon,
}: Readonly<Props>): ReactElement {
  return (
    <Surface sx={{ p: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {label}
        </Typography>
        <Box
          sx={(theme) => ({
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: '50%',
            color: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            flexShrink: 0,
          })}
        >
          <Icon sx={{ fontSize: iconSize.md }} />
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography
          variant="h5"
          sx={{ letterSpacing: letterSpacing.tight, fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </Typography>
        {change === null ? null : <ChangeBadge change={change} />}
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {caption}
      </Typography>
    </Surface>
  );
}
