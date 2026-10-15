import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import type { CrmOp } from '@exyconn/shell/graphql/generated';
import { OP_LABELS, opArity } from '../../operators';
import type { ConditionPath, FilterBuilderValues } from '../filter-builder.types';

interface OperatorSelectProps {
  path: ConditionPath;
  /** The operators the server allows on the chosen property. */
  ops: readonly CrmOp[];
}

/** How a condition compares, limited to what its property allows. */
export function OperatorSelect({ path, ops }: Readonly<OperatorSelectProps>) {
  const t = useT();
  const { control, getValues, setValue } = useFormContext<FilterBuilderValues>();
  return (
    <Controller
      name={`${path}.op`}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          select
          size="small"
          label={t('Operator')}
          name={field.name}
          value={field.value}
          inputRef={field.ref}
          onBlur={field.onBlur}
          onChange={(event) => {
            const next = event.target.value as CrmOp;
            const previous = getValues(`${path}.op`);
            field.onChange(next);
            // One date and a from/to pair are different values, so a new shape starts empty.
            if (previous === '' || opArity(previous) !== opArity(next)) {
              setValue(`${path}.values`, []);
            }
          }}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message && t(fieldState.error.message)}
          sx={{ minWidth: 180 }}
        >
          {ops.map((op) => (
            <MenuItem key={op} value={op}>
              {t(OP_LABELS[op])}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
