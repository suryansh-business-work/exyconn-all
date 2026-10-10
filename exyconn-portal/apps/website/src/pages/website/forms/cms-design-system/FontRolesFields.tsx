import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Flex,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@exyconn/shell/components/ui';
import {
  GENERIC_FAMILIES,
  fontStack,
  parseFontStack,
} from '../../../cms/design-system/font-sources';
import type { DesignSystemFormValues } from './cms-design-system.types';

interface FontStackInputProps {
  value: string;
  onChange: (value: string) => void;
  families: readonly string[];
  error?: string;
}

/** A role's stack as a family picker plus a generic fallback: `"Inter Tight", sans-serif`. */
function FontStackInput({ value, onChange, families, error }: Readonly<FontStackInputProps>) {
  const t = useT();
  const { family, fallback } = parseFontStack(value);
  // A stack written before (or naming a system font) stays selectable.
  const options = family && !families.includes(family) ? [family, ...families] : families;
  return (
    <>
      <TextField
        select
        size="small"
        label={t('Family')}
        value={family}
        onChange={(event) => onChange(fontStack(event.target.value, fallback))}
        sx={{ flexGrow: 1, minWidth: 180 }}
        error={Boolean(error)}
        helperText={error ? t(error) : value}
        slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
      >
        <MenuItem value="">{t('Fallback only')}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option} sx={{ fontFamily: `"${option}"` }}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label={t('Fallback')}
        value={fallback}
        onChange={(event) => onChange(fontStack(family, event.target.value))}
        sx={{ width: 150 }}
      >
        {GENERIC_FAMILIES.map((generic) => (
          <MenuItem key={generic} value={generic}>
            {generic}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}

/** Which family each typographic role (sans, display, mono…) uses: the `fonts` tokens. */
export function FontRolesFields({ families }: Readonly<{ families: readonly string[] }>) {
  const t = useT();
  const { control } = useFormContext<DesignSystemFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'fonts' });
  return (
    <Box>
      <Flex direction="column" gap={1.5}>
        {fields.map((field, index) => (
          <Flex key={field.id} gap={1} alignItems="flex-start" sx={{ flexWrap: 'wrap' }}>
            <Controller
              control={control}
              name={`fonts.${index}.key`}
              render={({ field: input, fieldState }) => (
                <TextField
                  {...input}
                  size="small"
                  label={t('Role')}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error
                      ? t(String(fieldState.error.message))
                      : `--font-family-${input.value}`
                  }
                  sx={{ width: 180 }}
                />
              )}
            />
            <Controller
              control={control}
              name={`fonts.${index}.value`}
              render={({ field: input, fieldState }) => (
                <FontStackInput
                  value={input.value}
                  onChange={input.onChange}
                  families={families}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Tooltip title={t('Remove')}>
              <IconButton
                aria-label={t('Remove role {position}', { position: index + 1 })}
                onClick={() => remove(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Flex>
        ))}
      </Flex>
      <Button
        size="small"
        startIcon={<AddIcon />}
        sx={{ mt: 1.5 }}
        onClick={() => append({ key: '', value: 'sans-serif' })}
      >
        {t('Add role')}
      </Button>
    </Box>
  );
}
