import type { SvgIconComponent } from '@mui/icons-material';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Chip, FitFigure, Skeleton, Stack, Typography, fontWeight } from '@/components/ui';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { panel } from '../glass/glass';
import { color, Sparkline } from '@exyconn/ui';
import { IconBubble } from './IconBubble';

export interface StatItem {
  label: string;
  /**
   * Values for a label written with `{placeholders}`.
   *
   * A label built by hand — `` `Leave taken ${year}` `` — would be a different catalogue key
   * every year, and every one of them would be sent for translation. "Leave taken {year}"
   * with a value is one key, for good.
   */
  labelValues?: Interpolations;
  value: string;
  delta?: number;
  accent?: string;
  /** The icon in the tile's pastel bubble. A neutral chart glyph stands in when none is given. */
  icon?: SvgIconComponent;
  series?: number[];
}

interface StatCardProps extends StatItem {
  /** The figure is still on its way: a placeholder stands in for it, not a misleading 0. */
  loading?: boolean;
}

/**
 * A stat tile: the accent's icon in a pastel bubble, a trend pill, a large light figure with
 * its muted label beneath, and a mini sparkline.
 */
export function StatCard({
  label,
  labelValues,
  value,
  delta,
  accent = color.orange[500],
  icon = InsightsOutlinedIcon,
  series,
  loading = false,
}: Readonly<StatCardProps>) {
  const t = useT();
  const up = (delta ?? 0) >= 0;
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <IconBubble icon={icon} accent={accent} />
        {delta !== undefined && (
          <Chip
            color={up ? 'success' : 'error'}
            icon={up ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${Math.abs(delta)}%`}
          />
        )}
      </Stack>
      {/* Sized like a heading, but not one: four numbers as <h6> straight after the page's
          <h1> skipped every level between and made the outline read as a list of figures. */}
      <FitFigure
        value={value}
        placeholder={loading ? <Skeleton width="40%" /> : undefined}
        sx={{ mt: 2 }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: fontWeight.medium }}>
        {t(label, labelValues)}
      </Typography>
      {series && !loading && (
        <Box sx={{ mt: 1.5 }}>
          <Sparkline values={series} color={accent} height={28} />
        </Box>
      )}
    </Box>
  );
}
