import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { usePayrollScheduleQuery } from '@exyconn/shell/graphql/generated';
import { PayslipScheduleForm } from './forms/payslip-schedule';

/** What the last scheduled run did, so HR can see it worked without opening the email log. */
function LastRun({
  schedule,
}: Readonly<{
  schedule: {
    lastRunAt?: string | null;
    lastRunPeriod: string;
    lastSent: number;
    lastFailed: number;
    lastSkipped: number;
  };
}>) {
  const t = useT();
  if (!schedule.lastRunAt) {
    return (
      <Text size="sm" color="text.secondary">
        {t('No scheduled run has happened yet.')}
      </Text>
    );
  }
  return (
    <Flex direction="column" spacing={1}>
      <DetailRow label={t('Last run')}>
        <Text size="sm">{format(new Date(schedule.lastRunAt), 'PPpp')}</Text>
      </DetailRow>
      <DetailRow label={t('Sent for')}>
        <Text size="sm">{schedule.lastRunPeriod}</Text>
      </DetailRow>
      <DetailRow label={t('Emailed')}>
        <Text size="sm">{schedule.lastSent}</Text>
      </DetailRow>
      <DetailRow label={t('Failed')}>
        <Text size="sm">{schedule.lastFailed}</Text>
      </DetailRow>
      <DetailRow label={t('No email address')}>
        <Text size="sm">{schedule.lastSkipped}</Text>
      </DetailRow>
    </Flex>
  );
}

/**
 * Payslip schedule — when the portal emails every employee their payslip PDF, and what
 * the last run did. HR can still send a month by hand from Payroll at any time.
 */
export function PayslipSchedulePage() {
  const t = useT();
  const { data, loading, error, refetch } = usePayrollScheduleQuery({
    fetchPolicy: 'cache-and-network',
  });
  const { settings } = useSettings();
  const schedule = data?.payrollSchedule;

  return (
    <Box>
      <PageHeader
        title="Payslip Schedule"
        subtitle="When payslips are emailed, in {timezone}"
        subtitleValues={{ timezone: settings.timezone }}
      />
      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && !schedule && <CircularProgress size={24} />}
      {schedule && (
        <Flex direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
          <Box sx={[readingPanel, { flex: 2, width: '100%' }]}>
            <PayslipScheduleForm
              initial={schedule}
              onCancel={() => {
                refetch().catch(() => undefined);
              }}
              onDone={() => {
                refetch().catch(() => undefined);
              }}
            />
          </Box>
          <Box sx={[readingPanel, { flex: 1, width: '100%' }]}>
            <Text weight="medium" sx={{ display: 'block', mb: 1.5 }}>
              {t('Last scheduled run')}
            </Text>
            <LastRun schedule={schedule} />
          </Box>
        </Flex>
      )}
    </Box>
  );
}
