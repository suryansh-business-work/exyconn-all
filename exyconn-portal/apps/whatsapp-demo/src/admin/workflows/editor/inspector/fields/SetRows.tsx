import { useFieldArray, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { CountedField } from './CountedField';

interface SetRowsProps {
  /** Path of the `set` rows, e.g. `set` or `buttons.0.set`. */
  name: string;
  /** English source for the heading. */
  title?: string;
}

/** The longest value a `set` entry may hold (schema.ts `vars`). */
const MAX_VALUE = 500;

/**
 * Variables to set, as key/value rows. Values may be templates (`{{slot|time}}`) or `$fn`
 * helpers (`$id:AP`, `$price:650:15`, `$days:2`); a row with no key is ignored.
 */
export function SetRows({ name, title = 'Set variables' }: Readonly<SetRowsProps>) {
  const t = useT();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <Flex direction="column" spacing={1}>
      <Flex alignItems="center" justifyContent="space-between">
        <Text size="caption" weight="semibold" color="text.secondary">
          {t(title)}
        </Text>
        <Button size="small" startIcon={<AddIcon />} onClick={() => append({ key: '', value: '' })}>
          {t('Add variable')}
        </Button>
      </Flex>
      {fields.map((field, index) => (
        <Flex key={field.id} alignItems="flex-start" gap={1}>
          <CountedField name={`${name}.${index}.key`} label="Name" />
          <CountedField
            name={`${name}.${index}.value`}
            label="Value"
            max={MAX_VALUE}
            hint="Text, {{var}} or a $ helper"
          />
          <IconButton
            size="small"
            aria-label={t('Remove variable {number}', { number: index + 1 })}
            onClick={() => remove(index)}
            sx={{ mt: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Flex>
      ))}
    </Flex>
  );
}
