import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Skeleton, Stack, Typography, iconSize, fontWeight } from '@/components/ui';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { panel } from '../glass/glass';
import { color, Sparkline } from '@exyconn/ui';

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
  series?: number[];
}

interface StatCardProps extends StatItem {
  /** The figure is still on its way: a placeholder stands in for it, not a misleading 0. */
  loading?: boolean;
}

/** A frosted stat tile: label, big value, trend delta and a mini sparkline. */
export function StatCard({
  label,
  labelValues,
  value,
  delta,
  accent = color.orange[500],
  series,
  loading = false,
}: Readonly<StatCardProps>) {
  const t = useT();
  const up = (delta ?? 0) >= 0;
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t(label, labelValues)}
        </Typography>
        {delta !== undefined && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              color: up ? 'success.main' : 'error.main',
            }}
          >
            {up ? (
              <TrendingUpIcon sx={{ fontSize: iconSize.md }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: iconSize.md }} />
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: fontWeight.bold,
              }}
            >
              {Math.abs(delta)}%
            </Typography>
          </Stack>
        )}
      </Stack>
      {/* Sized like a heading, but not one: four numbers as <h6> straight after the page's
          <h1> skipped every level between and made the outline read as a list of figures. */}
      <Typography
        variant="h6"
        component="p"
        sx={{
          fontWeight: fontWeight.bold,
          mt: 0.5,
        }}
      >
        {loading ? <Skeleton width="40%" /> : value}
      </Typography>
      {series && !loading && (
        <Box sx={{ mt: 0.5 }}>
          <Sparkline values={series} color={accent} height={28} />
        </Box>
      )}
    </Box>
  );
}
