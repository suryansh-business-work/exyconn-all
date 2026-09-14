import { useT } from '@exyconn/i18n';
import { Box, Stack, Typography, iconSize } from '@/components/ui';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { panel } from '../glass/glass';
import { Sparkline } from '../data/Sparkline';
import { color } from '@exyconn/ui';

export interface StatItem {
  label: string;
  value: string;
  delta?: number;
  accent?: string;
  series?: number[];
}

/** A frosted stat tile: label, big value, trend delta and a mini sparkline. */
export function StatCard({ label, value, delta, accent = color.orange[500], series }: StatItem) {
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
          {t(label)}
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
                fontWeight: 700,
              }}
            >
              {Math.abs(delta)}%
            </Typography>
          </Stack>
        )}
      </Stack>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
      {series && (
        <Box sx={{ mt: 0.5 }}>
          <Sparkline data={series} color={accent} height={28} />
        </Box>
      )}
    </Box>
  );
}
