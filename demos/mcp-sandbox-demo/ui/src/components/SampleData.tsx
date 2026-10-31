import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Card, CardContent, Typography } from '@exyconn/shell/components/ui';
import type { SandboxInfo } from '../pages/mcp-sandbox/useMcpSandbox';

const GRID = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
} as const;

/** How many sample records of each kind the sandbox company holds. */
export function SampleData({ info }: Readonly<{ info: SandboxInfo }>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  return (
    <Box component="ul" sx={{ ...GRID, m: 0, p: 0, listStyle: 'none' }}>
      {info.sample.map((kind) => (
        <Card component="li" key={kind.label} variant="outlined">
          <CardContent>
            <Typography variant="h4" component="p">
              {formatNumber(kind.count)}
            </Typography>
            <Typography color="text.secondary">{t(kind.label)}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
