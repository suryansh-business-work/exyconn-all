import { useT } from '@exyconn/i18n';
import { Chip, Flex } from '@/components/ui';
import { inWeekOrder, useWeekdayName } from './work-days';

interface WorkDayChipsProps {
  /** The days the person works, 0 (Sunday) to 6 (Saturday). */
  days: readonly number[];
  /** True when these are the company's week rather than the person's own. */
  fromCompany: boolean;
}

/** The days somebody works, as chips, saying whether they are the company's week or their own. */
export function WorkDayChips({ days, fromCompany }: Readonly<WorkDayChipsProps>) {
  const t = useT();
  const dayName = useWeekdayName();
  const variant = fromCompany ? 'outlined' : 'filled';
  return (
    <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
      {inWeekOrder(days).map((day) => (
        <Chip key={day} size="small" color="primary" variant={variant} label={dayName(day)} />
      ))}
      <Chip
        size="small"
        variant="outlined"
        label={fromCompany ? t('Company week') : t('Own week')}
      />
    </Flex>
  );
}
