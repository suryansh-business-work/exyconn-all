import { Box, Stack, Text } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import { formatMoney } from '@exyconn/shell/utils/money';

export interface MoneyLine {
  id: string;
  label: string;
  amount: number;
  /** Renders as the panel's bottom line: heavier, and coloured when negative. */
  total?: boolean;
}

interface Props {
  title: string;
  /** What this panel's figures actually mean — accrual or cash. Never left implicit. */
  basis: string;
  lines: readonly MoneyLine[];
}

/**
 * One column of the money story: a heading, the rule the figures follow, and the lines that
 * add up to a total.
 *
 * The basis line is not decoration. "Revenue" means two different numbers depending on
 * whether you count what was invoiced or what was banked, and a dashboard that does not say
 * which is the classic way to get two people arguing about the same figure.
 */
export function FinanceMoneyPanel({ title, basis, lines }: Readonly<Props>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Text size="label" component="div">
        {title}
      </Text>
      <Text size="caption" color="text.secondary" component="div" sx={{ mb: 1.5 }}>
        {basis}
      </Text>

      <Stack spacing={0.75}>
        {lines.map((line) => (
          <Stack key={line.id} direction="row" justifyContent="space-between" spacing={1.5}>
            <Text size="sm" color={line.total ? 'text.primary' : 'text.secondary'}>
              {line.label}
            </Text>
            <Text
              size="sm"
              weight={line.total ? 'bold' : 'medium'}
              color={line.total && line.amount < 0 ? 'error.main' : 'text.primary'}
            >
              {formatMoney(line.amount)}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
