import { Box, LinearProgress, Text } from '@exyconn/shell/components/ui';

interface Props {
  label: string;
  value: string;
  /** Draws a bar when there is a percentage to draw. Null leaves the value to speak alone. */
  percent?: number | null;
  color?: 'success' | 'warning' | 'error' | 'primary';
  /** Shown under the value when the figure needs explaining rather than plotting. */
  hint?: string;
}

/** One figure on the health page: a label, the number, and a bar when a bar means something. */
export function HealthStat({ label, value, percent, color = 'primary', hint }: Readonly<Props>) {
  return (
    <Box sx={{ minWidth: 140, flex: '1 1 140px' }}>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
      <Text weight="medium" size="lg">
        {value}
      </Text>
      {percent !== null && percent !== undefined ? (
        <LinearProgress
          variant="determinate"
          // The bar stops at full; the number above says how far past it went.
          value={Math.min(percent, 100)}
          color={color}
          sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
        />
      ) : null}
      {hint ? (
        <Text size="caption" color="text.secondary">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}
