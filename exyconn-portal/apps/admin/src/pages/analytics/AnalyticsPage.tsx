import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Stack, Text, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { useWorkspaceAnalyticsQuery } from '@exyconn/shell/graphql/generated';
import { UsersSection } from './UsersSection';
import { EmployeesSection } from './EmployeesSection';
import { TrackerSection } from './TrackerSection';
import { PlatformSection } from './PlatformSection';

/** The periods the page can cover, in days. */
const PERIODS = [7, 30, 90] as const;
const DEFAULT_PERIOD = 30;

/** Admin › Analytics: users, employees and the tracker — and, for SUPER_ADMIN, the platform. */
export function AnalyticsPage() {
  const t = useT();
  const { user } = useAuth();
  const [days, setDays] = useState<number>(DEFAULT_PERIOD);
  const { data, error, loading } = useWorkspaceAnalyticsQuery({
    variables: { days },
    fetchPolicy: 'cache-and-network',
  });
  const report = data?.workspaceAnalytics;
  const seesPlatform = user?.roles.includes(ROLES.SUPER_ADMIN) ?? false;

  return (
    <Box>
      <PageHeader
        title="Analytics"
        subtitle="Users, employees and the employee tracker, in the workspace timezone"
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={days}
          aria-label={t('Analytics period')}
          onChange={(_event, next: number | null) => {
            if (next) {
              setDays(next);
            }
          }}
        >
          {PERIODS.map((period) => (
            <ToggleButton key={period} value={period}>
              {t('{count} days', { count: period })}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </PageHeader>
      <Stack spacing={3}>
        {seesPlatform && <PlatformSection />}
        {error && <Text color="error">{error.message}</Text>}
        {loading && !report && <Text color="text.secondary">{t('Loading analytics…')}</Text>}
        {report && (
          <>
            <UsersSection users={report.users} />
            <EmployeesSection employees={report.employees} />
            <TrackerSection tracker={report.tracker} />
          </>
        )}
      </Stack>
    </Box>
  );
}
