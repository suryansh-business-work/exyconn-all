import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import CakeIcon from '@mui/icons-material/Cake';
import type { Anniversary } from './hrDashboard.selectors';

interface HrAnniversariesProps {
  anniversaries: Anniversary[];
  formatDate: (value: Date) => string;
}

function when(daysAway: number): string {
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return `In ${daysAway} days`;
}

/** Work anniversaries in the next month — the cheapest recognition there is. */
export function HrAnniversaries({ anniversaries, formatDate }: Readonly<HrAnniversariesProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Work anniversaries</Heading>
      {anniversaries.length === 0 && (
        <Text size="sm" color="text.secondary">
          None in the next 30 days.
        </Text>
      )}
      {anniversaries.map((a) => (
        <Flex key={a.user.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.25 }}>
          <CakeIcon fontSize="small" color="secondary" />
          <Box>
            <Text weight="medium">
              {a.user.name} · {a.years} {a.years === 1 ? 'year' : 'years'}
            </Text>
            <Text size="caption" color="text.secondary">
              {when(a.daysAway)} · {formatDate(a.on)}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
