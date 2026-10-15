import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Autocomplete, TextField } from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../../schema';
import type { ConditionPath, FilterBuilderValues } from '../filter-builder.types';

type Option = CrmPropertyInfo['options'][number];

interface EnumValuesFieldProps {
  path: ConditionPath;
  property: CrmPropertyInfo;
}

/** "is any of" / "is none of": several options picked by label, sent as their stored values. */
export function EnumValuesField({ path, property }: Readonly<EnumValuesFieldProps>) {
  const t = useT();
  const { control } = useFormContext<FilterBuilderValues>();
  return (
    <Controller
      name={`${path}.values`}
      control={control}
      render={({ field }) => {
        const chosen = new Set(field.value);
        return (
          <Autocomplete<Option, true>
            multiple
            size="small"
            options={property.options}
            value={property.options.filter((option) => chosen.has(option.value))}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            onChange={(_event, options) => field.onChange(options.map((option) => option.value))}
            onBlur={field.onBlur}
            renderInput={(params) => <TextField {...params} label={t('Values')} />}
          />
        );
      }}
    />
  );
}
