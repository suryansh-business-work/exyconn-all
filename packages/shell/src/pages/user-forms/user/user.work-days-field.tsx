import { useT } from '@exyconn/i18n';
import { RhfWorkDays } from '@/components/form/rhf';
import { useWeekLabel } from '@/components/work';
import { useWorkWeekQuery } from '@/graphql/generated';

/** The employee's own working week; no days picked means they follow the company's. */
export function WorkDaysField() {
  const t = useT();
  const weekLabel = useWeekLabel();
  const { data } = useWorkWeekQuery();
  const companyWeek = data?.workWeek.defaultWorkDays;
  const hint = companyWeek
    ? t('Leave empty to follow the company week ({days}).', { days: weekLabel(companyWeek) })
    : t('Leave empty to follow the company week.');
  return <RhfWorkDays name="workDays" label="Work days" helperText={hint} />;
}
