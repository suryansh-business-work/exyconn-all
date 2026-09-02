import { Box, Card, CardHeader, Divider, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useMyPayrollQuery } from '@exyconn/shell/graphql/generated';

type RowProps = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: string;
};

/** A single label/value line in the salary breakdown. */
function Row({ label, value, strong, tone }: RowProps) {
  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Text color="text.secondary">{label}</Text>
      <Text weight={strong ? 'bold' : 'medium'} color={tone}>
        {value}
      </Text>
    </Flex>
  );
}

/** Employee self-service: view your current monthly salary structure. */
export function PayrollPage() {
  const { data, loading } = useMyPayrollQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();

  const p = data?.myPayroll;

  return (
    <Box>
      <PageHeader title="Payroll" subtitle="Your current monthly salary structure" />

      {!p ? (
        <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
          {loading ? (
            <Text>Loading…</Text>
          ) : (
            <Text color="text.secondary">No salary structure on file yet.</Text>
          )}
        </Box>
      ) : (
        <Card sx={{ maxWidth: 520 }}>
          <CardHeader
            title={<Heading level={5}>Monthly salary</Heading>}
            subheader={`Effective ${formatDate(p.effectiveFrom)}`}
          />
          <Box sx={{ px: 2, pb: 2 }}>
            <Row label="Basic" value={formatMoney(p.basic, p.currency)} />
            <Row label="HRA" value={formatMoney(p.hra, p.currency)} />
            <Row label="Allowances" value={formatMoney(p.allowances, p.currency)} />
            <Row
              label="Deductions"
              value={`- ${formatMoney(p.deductions, p.currency)}`}
              tone="error.main"
            />
            <Divider />
            <Row label="Gross" value={formatMoney(p.gross, p.currency)} strong />
            <Flex
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1, py: 1, px: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <Heading level={6}>Net pay</Heading>
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
