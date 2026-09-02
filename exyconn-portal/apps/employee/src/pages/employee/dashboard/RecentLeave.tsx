import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';

export interface LeaveSummaryRow {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  status: string;
}

interface RecentLeaveProps {
  requests: LeaveSummaryRow[];
  formatDate: (value: string) => string;
}

/** The employee's most recent leave requests and where each one stands. */
export function RecentLeave({ requests, formatDate }: Readonly<RecentLeaveProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Recent leave</Heading>
      {requests.length === 0 && (
        <Text size="sm" color="text.secondary">
          No leave requests yet.
        </Text>
      )}
      {requests.map((request) => (
        <Flex key={request.id} direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
          <Text size="sm">
            {request.type} · {formatDate(request.fromDate)} → {formatDate(request.toDate)}
          </Text>
          <Text size="sm" color="text.secondary">
            {request.status}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}
