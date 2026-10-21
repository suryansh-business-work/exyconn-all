import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Autocomplete, TextField } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AudienceFilterKind,
  useAudienceFilterValuesQuery,
  type AudienceFilterCatalogueQuery,
  type AudienceRuleOperator,
} from '@exyconn/shell/graphql/generated';
import { DAY_OPERATORS, VALUELESS_OPERATORS, type AudienceFormValues } from './audience-list.types';

export type FilterFieldEntry =
  AudienceFilterCatalogueQuery['audienceFilterCatalogue']['fields'][number];

interface AudienceConditionValueProps {
  index: number;
  field: FilterFieldEntry;
  operator: AudienceRuleOperator;
}

/** Free text with the values already in the CRM offered as suggestions. */
function SuggestedValue({
  index,
  field,
}: Readonly<Pick<AudienceConditionValueProps, 'index' | 'field'>>) {
  const t = useT();
  const { control } = useFormContext<AudienceFormValues>();
  const { data, loading } = useAudienceFilterValuesQuery({ variables: { field: field.key } });
  return (
    <Controller
      name={`conditions.${index}.value`}
      control={control}
      render={({ field: value, fieldState }) => (
        <Autocomplete
          freeSolo
          options={data?.audienceFilterValues ?? []}
          loading={loading}
          value={value.value}
          onInputChange={(_event, next) => value.onChange(next)}
          onBlur={value.onBlur}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('Value')}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            />
          )}
        />
      )}
    />
  );
}

/** The value input a condition needs: none, a number of days, a fixed list, or text. */
export function AudienceConditionValue({
  index,
  field,
  operator,
}: Readonly<AudienceConditionValueProps>) {
  const name = `conditions.${index}.value`;
  if (VALUELESS_OPERATORS.has(operator)) {
    return null;
  }
  if (DAY_OPERATORS.has(operator)) {
    return (
      <RhfTextField
        name={name}
        label="Days"
        type="number"
        helperText="A whole number of days counted back from today."
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
      />
    );
  }
  if (field.kind === AudienceFilterKind.Enum || field.kind === AudienceFilterKind.EmailStatus) {
    return (
      <RhfSelect
        name={name}
        label="Value"
        options={enumOptions(field.values)}
        helperText="The value the field is compared with."
      />
    );
  }
  return <SuggestedValue index={index} field={field} />;
}
