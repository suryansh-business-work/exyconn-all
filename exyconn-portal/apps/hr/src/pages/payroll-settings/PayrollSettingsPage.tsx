import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { usePayrollSettingsQuery } from '@exyconn/shell/graphql/generated';
import { PayrollSettingsForm } from './forms/payroll-settings';
import type { PayrollSettingsRow } from './forms/payroll-settings';

const OFF = 'Not withheld';

/** What each TDS mode means, in the words HR chose it by. */
const TDS_SUMMARY: Record<string, string> = {
  NONE: OFF,
  FLAT_PERCENT: 'A flat percentage of taxable pay',
  SLAB: 'The bands in HR › Tax Slabs, unless the employee has their own rate',
};

/** What each head currently costs an employee, in the words a payslip uses. */
function PolicySummary({ settings }: Readonly<{ settings: PayrollSettingsRow }>) {
  const t = useT();
  const pf = settings.pfEnabled
    ? t('{percent}% of basic, capped at {ceiling}', {
        percent: settings.pfEmployeePercent,
        ceiling: settings.pfWageCeiling,
      })
    : t(OFF);
  const esi = settings.esiEnabled
    ? t('{percent}% of gross, up to {limit}', {
        percent: settings.esiEmployeePercent,
        limit: settings.esiWageLimit,
      })
    : t(OFF);
  const professionalTax =
    settings.professionalTaxMonthly > 0
      ? t('{amount} a month', { amount: settings.professionalTaxMonthly })
      : t(OFF);
  const tds = t(TDS_SUMMARY[settings.tdsMode] ?? OFF);

  return (
    <Flex direction="column" spacing={1}>
      <DetailRow label={t('Provident fund')}>
        <Text size="sm">{pf}</Text>
      </DetailRow>
      <DetailRow label={t('Employee state insurance')}>
        <Text size="sm">{esi}</Text>
      </DetailRow>
      <DetailRow label={t('Professional tax')}>
        <Text size="sm">{professionalTax}</Text>
      </DetailRow>
      <DetailRow label={t('Income tax')}>
        <Text size="sm">{tds}</Text>
      </DetailRow>
    </Flex>
  );
}

/**
 * HR › Payroll Settings — the statutory deductions every payslip is worked out from.
 *
 * One policy for the company; a single employee's exceptions (outside the PF scheme, their
 * own TDS rate) live on their salary structure and beat what is set here.
 */
export function PayrollSettingsPage() {
  const t = useT();
  const { data, loading, error, refetch } = usePayrollSettingsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const settings = data?.payrollSettings;
  const reload = () => {
    refetch().catch(() => undefined);
  };

  return (
    <Box>
      <PageHeader
        title="Payroll Settings"
        subtitle="Statutory deductions — PF, ESI, professional tax and income tax"
      />
      {error && <Alert severity="error">{error.message}</Alert>}
      {loading && !settings && <CircularProgress size={24} />}
      {settings && (
        <Flex direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
          <Box sx={[readingPanel, { flex: 2, width: '100%' }]}>
            <PayrollSettingsForm initial={settings} onCancel={reload} onDone={reload} />
          </Box>
          <Box sx={[readingPanel, { flex: 1, width: '100%' }]}>
            <Text weight="medium" sx={{ display: 'block', mb: 1.5 }}>
              {t('What the next run will withhold')}
            </Text>
            <PolicySummary settings={settings} />
          </Box>
        </Flex>
      )}
    </Box>
  );
}
