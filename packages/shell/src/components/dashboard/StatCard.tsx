import { Box, Stack, Typography, iconSize } from '@/components/ui';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { glass } from '../glass/glass';
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
  const up = (delta ?? 0) >= 0;
  return (
    <Box sx={[glass, { p: 1.5, height: '100%' }]}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          {label}
        </Typography>
        {delta !== undefined && (
          <Stack
            direction="row"
            spacing={0.3}
            sx={{
              alignItems: "center",
              color: up ? 'success.main' : 'error.main'
            }}>
            {up ? (
              <TrendingUpIcon sx={{ fontSize: iconSize.md }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: iconSize.md }} />
            )}
            <Typography variant="caption" sx={{
              fontWeight: 700
            }}>
              {Math.abs(delta)}%
            </Typography>
          </Stack>
        )}
      </Stack>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mt: 0.25
        }}>
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
