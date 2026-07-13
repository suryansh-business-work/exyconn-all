import { Box, Stack, Typography } from '@/components/ui';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { glass } from '../glass/glass';
import { Sparkline } from '../data/Sparkline';

export interface StatItem {
  label: string;
  value: string;
  delta?: number;
  accent?: string;
  series?: number[];
}

/** A frosted stat tile: label, big value, trend delta and a mini sparkline. */
export function StatCard({ label, value, delta, accent = '#f9851f', series }: StatItem) {
  const up = (delta ?? 0) >= 0;
  return (
    <Box sx={[glass, { p: 1.5, height: '100%' }]}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {delta !== undefined && (
          <Stack
            direction="row"
            spacing={0.3}
            alignItems="center"
            sx={{ color: up ? 'success.main' : 'error.main' }}
          >
            {up ? (
              <TrendingUpIcon sx={{ fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16 }} />
            )}
            <Typography variant="caption" fontWeight={700}>
              {Math.abs(delta)}%
            </Typography>
          </Stack>
        )}
      </Stack>
      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>
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
