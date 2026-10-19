import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, IconButton, MenuItem, Stack, TextField, Tooltip } from '@exyconn/shell/components/ui';
import { RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { AudienceConditionValue, type FilterFieldEntry } from './AudienceConditionValue';
import { OPERATOR_LABELS } from './audience-list.options';
import type { AudienceFormValues } from './audience-list.types';

interface AudienceConditionRowProps {
  index: number;
  fields: readonly FilterFieldEntry[];
  onRemove: () => void;
}

/** One condition: a field, how it is compared, and what with. */
export function AudienceConditionRow({
  index,
  fields,
  onRemove,
}: Readonly<AudienceConditionRowProps>) {
  const t = useT();
  const { control, setValue } = useFormContext<AudienceFormValues>();
  const [fieldKey, operator] = useWatch({
    control,
    name: [`conditions.${index}.field`, `conditions.${index}.operator`],
  });
  const field = fields.find((entry) => entry.key === fieldKey);
  const fieldOptions: SelectOption[] = fields.map((entry) => ({
    value: entry.key,
    label: t(entry.label),
  }));
  const operatorOptions: SelectOption[] = (field?.operators ?? []).map((op) => ({
    value: op,
    label: t(OPERATOR_LABELS[op]),
  }));

  // A new field may not allow the old comparison or value: start it from its first operator.
  const onFieldChange = (key: string) => {
    const next = fields.find((entry) => entry.key === key);
    if (next && !next.operators.includes(operator)) {
      setValue(`conditions.${index}.operator`, next.operators[0]);
    }
    setValue(`conditions.${index}.value`, '');
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      sx={{ alignItems: { md: 'flex-start' } }}
      role="group"
      aria-label={t('Condition {number}', { number: index + 1 })}
    >
      <Box sx={{ flex: 2 }}>
        <Controller
          name={`conditions.${index}.field`}
          control={control}
          render={({ field: picked, fieldState }) => (
            <TextField
              {...picked}
              select
              fullWidth
              label={t('Field')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              onChange={(event) => {
                picked.onChange(event.target.value);
                onFieldChange(event.target.value);
              }}
            >
              {fieldOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Box>
      <Box sx={{ flex: 1.5 }}>
        <RhfSelect
          name={`conditions.${index}.operator`}
          label="Comparison"
          options={operatorOptions}
        />
      </Box>
      <Box sx={{ flex: 2 }}>
        {field && operator && (
          <AudienceConditionValue index={index} field={field} operator={operator} />
        )}
      </Box>
      <Tooltip title={t('Remove condition')}>
        <IconButton
          aria-label={t('Remove condition {number}', { number: index + 1 })}
          onClick={onRemove}
        >
          <DeleteOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
