import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Text,
  Typography,
  fontWeight,
  numeric,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { RATING_COLOR } from './sonar.types';

/** An A–E rating as a chip, or nothing when the server did not compute one. */
export function RatingChip({ rating, label }: Readonly<{ rating?: string | null; label: string }>) {
  const t = useT();
  if (!rating) {
    return null;
  }
  return (
    <Chip
      size="small"
      color={RATING_COLOR[rating] ?? 'default'}
      label={rating}
      aria-label={t('{label} rating {rating}', { label: t(label), rating })}
    />
  );
}

interface MetricTileProps {
  label: string;
  value: string;
  /** A chip beside the figure, e.g. the rating. */
  badge?: ReactNode;
  /** A line under the figure, e.g. what new code added. */
  note?: string;
  /** 0–100 shown as a bar under the figure (coverage, duplication). */
  percent?: number | null;
}

/** One measure: label, figure, an optional rating chip, bar and note. */
export function SonarMetricTile({ label, value, badge, note, percent }: Readonly<MetricTileProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="caption" color="text.secondary">
          {t(label)}
        </Text>
        {badge}
      </Stack>
      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: fontWeight.regular, fontVariantNumeric: numeric.tabular, mt: 1 }}
      >
        {value}
      </Typography>
      {percent !== undefined && percent !== null && (
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(percent, 0), 100)}
          aria-label={t(label)}
          sx={{ my: 1, height: 6, borderRadius: 3 }}
        />
      )}
      {note && (
        <Text size="caption" color="text.secondary" component="p">
          {note}
        </Text>
      )}
    </Box>
  );
}
