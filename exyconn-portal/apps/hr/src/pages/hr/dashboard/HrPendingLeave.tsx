import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { PendingLeave } from './hrDashboard.selectors';

interface HrPendingLeaveProps {
  rows: PendingLeave[];
  formatDate: (value: string) => string;
}

/** Leave requests waiting on HR — the queue this dashboard exists to surface. */
export function HrPendingLeave({ rows, formatDate }: Readonly<HrPendingLeaveProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Pending leave approvals</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          Nothing waiting on you.
        </Text>
      )}
      {rows.map((row) => (
        <Flex
          key={row.id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1.25 }}
        >
          <Box>
            <Text weight="medium">{row.employeeName}</Text>
            <Text size="caption" color="text.secondary">
              {formatDate(row.fromDate)} → {formatDate(row.toDate)}
            </Text>
          </Box>
          <StatusChip value={row.type} />
        </Flex>
      ))}
    </Box>
  );
}
