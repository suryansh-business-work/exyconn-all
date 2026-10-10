import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  TextField,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { ColorValueInput } from './ColorValueInput';
import type { DesignSystemFormValues, TokenGroupName } from './cms-design-system.types';

interface TokenListFieldsProps {
  name: TokenGroupName;
  /** The CSS custom property each token becomes, e.g. `--radius-`. */
  prefix: string;
  /** Adds a colour picker beside each value. */
  colors?: boolean;
  hint: string;
}

/** A list of design tokens (name → CSS value) with add and remove. */
export function TokenListFields({
  name,
  prefix,
  colors = false,
  hint,
}: Readonly<TokenListFieldsProps>) {
  const t = useT();
  const { control } = useFormContext<DesignSystemFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <Box>
      <Text size="sm" color="text.secondary" component="p" sx={{ mb: 2 }}>
        {t(hint)}
      </Text>
      <Flex direction="column" gap={1.5}>
        {fields.map((field, index) => (
          <Flex key={field.id} gap={1} alignItems="flex-start">
            <Controller
              control={control}
              name={`${name}.${index}.key`}
              render={({ field: input, fieldState }) => (
                <TextField
                  {...input}
                  size="small"
                  label={t('Name')}
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error
                      ? t(String(fieldState.error.message))
                      : `${prefix}${input.value}`
                  }
                  sx={{ width: 220, flexShrink: 0 }}
                />
              )}
            />
            <Controller
              control={control}
              name={`${name}.${index}.value`}
              render={({ field: input, fieldState }) => (
                <>
                  {colors && (
                    <ColorValueInput
                      value={input.value}
                      onChange={input.onChange}
                      label={input.name}
                    />
                  )}
                  <TextField
                    {...input}
                    size="small"
                    label={t('Value')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error ? t(String(fieldState.error.message)) : undefined}
                    sx={{ flexGrow: 1 }}
                    slotProps={{ htmlInput: { spellCheck: false } }}
                  />
                </>
              )}
            />
            <Tooltip title={t('Remove')}>
              <IconButton
                aria-label={t('Remove token {position}', { position: index + 1 })}
                onClick={() => remove(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Flex>
        ))}
      </Flex>
      <Button
        startIcon={<AddIcon />}
        size="small"
        sx={{ mt: 1.5 }}
        onClick={() => append({ key: '', value: '' })}
      >
        {t('Add token')}
      </Button>
    </Box>
  );
}
