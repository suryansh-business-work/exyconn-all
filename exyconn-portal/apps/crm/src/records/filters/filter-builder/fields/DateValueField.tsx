import { endOfDay, startOfDay } from 'date-fns';
import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { DatePicker } from '@exyconn/shell/components/ui';
import { toDate } from '@exyconn/shell/utils/date';
import type { ConditionPath, FilterBuilderValues } from '../filter-builder.types';

interface DateValueFieldProps {
  path: ConditionPath;
  index: 0 | 1;
  label: string;
  /**
   * Which end of the picked day is sent: "after 3 May" means after the whole of that day, and
   * "before 3 May" or "between 3 and 5 May" starts at its first moment.
   */
  edge: 'start' | 'end';
}

/** One date of a condition, picked with the MUI X date picker and stored as an ISO string. */
export function DateValueField({ path, index, label, edge }: Readonly<DateValueFieldProps>) {
  const t = useT();
  const { control } = useFormContext<FilterBuilderValues>();
  const toBoundary = edge === 'end' ? endOfDay : startOfDay;
  return (
    <Controller
      name={`${path}.values.${index}`}
      control={control}
      render={({ field }) => (
        <DatePicker
          label={t(label)}
          value={toDate(field.value)}
          // A half-typed date arrives as an Invalid Date; it is simply "not set yet".
          onChange={(date) =>
            field.onChange(
              date && !Number.isNaN(date.getTime()) ? toBoundary(date).toISOString() : '',
            )
          }
          slotProps={{
            textField: { size: 'small', fullWidth: true, onBlur: field.onBlur, name: field.name },
          }}
        />
      )}
    />
  );
}
