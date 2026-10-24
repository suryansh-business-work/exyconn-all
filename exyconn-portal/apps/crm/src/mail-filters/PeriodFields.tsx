import { useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { RhfDatePicker, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { PERIOD_OPTIONS } from './mailPeriod';

/** The Date select (presets or custom) and, for a custom range, the two date pickers. */
export function PeriodFields() {
  const t = useT();
  const { control } = useFormContext<{ period: string; after: string }>();
  const period = useWatch({ control, name: 'period' });
  const after = useWatch({ control, name: 'after' });
  return (
    <>
      <RhfSelect
        name="period"
        label="Date"
        options={PERIOD_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) }))}
        helperText="When the latest message of the conversation was sent"
      />
      {period === 'CUSTOM' && (
        <>
          <RhfDatePicker name="after" label="From" helperText="The first day to include" />
          <RhfDatePicker
            name="before"
            label="To"
            minDate={after || undefined}
            helperText="The last day to include"
          />
        </>
      )}
    </>
  );
}
