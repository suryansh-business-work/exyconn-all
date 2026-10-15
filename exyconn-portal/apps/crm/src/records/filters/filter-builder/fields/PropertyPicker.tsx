import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Autocomplete, Box, Text, TextField } from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../../schema';
import { PROPERTY_TYPE_LABEL, propertyLabel } from '../../../propertyText';
import type { ConditionPath, FilterBuilderValues } from '../filter-builder.types';

interface PropertyPickerProps {
  path: ConditionPath;
  properties: readonly CrmPropertyInfo[];
}

/**
 * Which property a condition tests, grouped Built-in then Custom with each one's type. Picking
 * another property starts its operator and values again: what "Value is greater than" took
 * means nothing to "Stage".
 */
export function PropertyPicker({ path, properties }: Readonly<PropertyPickerProps>) {
  const t = useT();
  const { control, setValue } = useFormContext<FilterBuilderValues>();
  // Grouping needs the options already in group order.
  const options = useMemo(
    () => [...properties.filter((p) => p.builtIn), ...properties.filter((p) => !p.builtIn)],
    [properties],
  );
  return (
    <Controller
      name={`${path}.property`}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete<CrmPropertyInfo>
          size="small"
          options={options}
          value={options.find((option) => option.key === field.value) ?? null}
          groupBy={(option) => (option.builtIn ? t('Built-in') : t('Custom'))}
          getOptionLabel={(option) => propertyLabel(t, option)}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          onChange={(_event, option) => {
            field.onChange(option?.key ?? '');
            setValue(`${path}.op`, option?.ops[0] ?? '');
            setValue(`${path}.values`, []);
          }}
          onBlur={field.onBlur}
          renderOption={(props, option) => {
            const { key, ...rest } = props;
            return (
              <Box component="li" key={key} {...rest}>
                <Box sx={{ flex: 1 }}>{propertyLabel(t, option)}</Box>
                <Text size="caption" color="text.secondary">
                  {t(PROPERTY_TYPE_LABEL[option.type])}
                </Text>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('Property')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message && t(fieldState.error.message)}
            />
          )}
          sx={{ minWidth: 200 }}
        />
      )}
    />
  );
}
