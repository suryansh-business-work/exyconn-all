import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { PendingLeave } from './hrDashboard.selectors';

interface HrPendingLeaveProps {
  rows: PendingLeave[];
  formatDate: (value: string) => string;
}

/** Leave requests waiting on HR — the queue this dashboard exists to surface. */
export function HrPendingLeave({ rows, formatDate }: Readonly<HrPendingLeaveProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Pending leave approvals')}</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('Nothing waiting on you.')}
        </Text>
      )}
      {rows.map((row) => (
        <Flex
          key={row.id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1.5 }}
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
