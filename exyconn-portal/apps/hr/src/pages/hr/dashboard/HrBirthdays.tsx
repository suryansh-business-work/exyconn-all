import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import CelebrationIcon from '@mui/icons-material/Celebration';
import type { Recurring } from './hrDashboard.selectors';

interface HrBirthdaysProps {
  birthdays: Recurring[];
  formatDate: (value: Date) => string;
}

function when(daysAway: number): string {
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return `In ${daysAway} days`;
}

/** Birthdays in the next month. The year of birth is never shown. */
export function HrBirthdays({ birthdays, formatDate }: Readonly<HrBirthdaysProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Birthdays</Heading>
      {birthdays.length === 0 && (
        <Text size="sm" color="text.secondary">
          None in the next 30 days.
        </Text>
      )}
      {birthdays.map((b) => (
        <Flex key={b.user.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.25 }}>
          <CelebrationIcon fontSize="small" color="error" />
          <Box>
            <Text weight="medium">{b.user.name}</Text>
            <Text size="caption" color="text.secondary">
              {when(b.daysAway)} · {formatDate(b.on)}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
