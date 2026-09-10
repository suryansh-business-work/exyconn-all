import { Box, LinearProgress, Text } from '@exyconn/shell/components/ui';

/** Above this share of the budget, a centre is worth looking at before the month ends. */
const WARNING_AT = 90;

interface Props {
  /** Null where there is no budget to be a percentage of. */
  utilisation: number | null;
}

/** Green under budget, amber close to it, red over. Null budget shows no bar to read. */
function colourFor(utilisation: number): 'success' | 'warning' | 'error' {
  if (utilisation > 100) return 'error';
  if (utilisation >= WARNING_AT) return 'warning';
  return 'success';
}

/** How much of a centre's budget is gone, as a bar plus the number it is drawn from. */
export function VarianceBar({ utilisation }: Readonly<Props>) {
  if (utilisation === null) {
    return (
      <Text size="caption" color="text.secondary">
        No budget set
      </Text>
    );
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <LinearProgress
        variant="determinate"
        // The bar stops at full; the number above it is what says how far past it went.
        value={Math.min(utilisation, 100)}
        color={colourFor(utilisation)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      <Text size="caption" color="text.secondary">
        {utilisation.toFixed(0)}% used
      </Text>
    </Box>
  );
}
