import { useT } from '@exyconn/i18n';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { formatMoney } from '@exyconn/shell/utils/money';
import type { SelectionTotals } from './runPlan';

/** One labelled figure in the totals bar. */
function Figure({ label, value }: Readonly<{ label: string; value: string }>) {
  const t = useT();
  return (
    <Flex direction="column">
      <Text size="caption" color="text.secondary">
        {t(label)}
      </Text>
      <Text weight="medium">{value}</Text>
    </Flex>
  );
}

/** What the employees picked so far add up to, updated as each box is ticked. */
export function SelectionTotalsBar({ totals }: Readonly<{ totals: SelectionTotals }>) {
  return (
    <Flex
      direction="row"
      spacing={3}
      sx={{ flexWrap: 'wrap', rowGap: 1 }}
      role="status"
      aria-live="polite"
    >
      <Figure label="Selected" value={String(totals.count)} />
      <Figure label="Total gross" value={formatMoney(totals.gross)} />
      <Figure label="Total deductions" value={formatMoney(totals.deductions)} />
      <Figure label="Total net" value={formatMoney(totals.net)} />
    </Flex>
  );
}
