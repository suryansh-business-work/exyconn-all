import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';

/** Just enough of an employee to say whose probation is ending, and when. */
export interface ProbationRow {
  id: string;
  name: string;
  designation?: string | null;
  probationEndDate?: string | null;
}

interface HrProbationsProps {
  rows: ProbationRow[];
  formatDate: (value: string) => string;
}

/**
 * Who comes off probation soon.
 *
 * A confirmation that nobody remembered to make is a decision made by default, so the date
 * is put in front of HR before it passes rather than after.
 */
export function HrProbations({ rows, formatDate }: Readonly<HrProbationsProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Coming off probation</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          Nobody’s probation ends in the next 30 days.
        </Text>
      )}
      {rows.map((row) => (
        <Flex key={row.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.25 }}>
          <HourglassBottomIcon fontSize="small" color="warning" />
          <Box sx={{ minWidth: 0 }}>
            <Text weight="medium">{row.name}</Text>
            <Text size="caption" color="text.secondary">
              {row.probationEndDate ? formatDate(row.probationEndDate) : '—'}
              {row.designation ? ` · ${row.designation}` : ''}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
