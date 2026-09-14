import { useT } from '@exyconn/i18n';
import { Box, Card, CardHeader, Divider, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMyPayrollQuery } from '@exyconn/shell/graphql/generated';
import { readingPanel } from '@exyconn/shell/components/glass/glass';

type RowProps = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: string;
};

/** A single label/value line in the salary breakdown. */
function Row({ label, value, strong, tone }: RowProps) {
  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
      <Text color="text.secondary">{label}</Text>
      <Text weight={strong ? 'bold' : 'medium'} color={tone}>
        {value}
      </Text>
    </Flex>
  );
}

/** Employee self-service: view your current monthly salary structure. */
export function PayrollPage() {
  const t = useT();
  const { data, loading } = useMyPayrollQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();

  const p = data?.myPayroll;

  return (
    <Box>
      <PageHeader title="Payroll" subtitle="Your current monthly salary structure" />

      {!p ? (
        <Box sx={readingPanel}>
          {loading ? (
            <Text>{t('Loading…')}</Text>
          ) : (
            <Text color="text.secondary">{t('No salary structure on file yet.')}</Text>
          )}
        </Box>
      ) : (
        <Card sx={{ maxWidth: 520 }}>
          <CardHeader
            title={<Heading level={5}>{t('Monthly salary')}</Heading>}
            subheader={t('Effective {date}', { date: formatDate(p.effectiveFrom) })}
          />
          <Box sx={{ px: 2, pb: 2 }}>
            <Row label={t('Basic')} value={formatMoney(p.basic, p.currency)} />
            <Row label={t('HRA')} value={formatMoney(p.hra, p.currency)} />
            <Row label={t('Allowances')} value={formatMoney(p.allowances, p.currency)} />
            <Row
              label={t('Deductions')}
              value={`- ${formatMoney(p.deductions, p.currency)}`}
              tone="error.main"
            />
            <Divider />
            <Row label={t('Gross')} value={formatMoney(p.gross, p.currency)} strong />
            <Flex
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1, py: 1, px: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <Heading level={6}>{t('Net pay')}</Heading>
              <Heading level={6} sx={{ color: 'success.main' }}>
                {formatMoney(p.net, p.currency)}
              </Heading>
            </Flex>
          </Box>
        </Card>
      )}
    </Box>
  );
}
