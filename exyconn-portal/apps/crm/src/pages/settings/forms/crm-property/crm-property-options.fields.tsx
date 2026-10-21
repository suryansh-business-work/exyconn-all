import { useEffect, useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfFieldArrayError, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { keyFromLabel } from './crm-property.key';
import type { CrmPropertyFormValues } from './crm-property.types';

interface OptionRowProps {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}

/**
 * One choice: its label, and the value records store. A new choice's value follows its label
 * until somebody edits it; a saved choice keeps its value, which records already hold.
 */
function OptionRow({ index, count, onMove, onRemove }: Readonly<OptionRowProps>) {
  const t = useT();
  const { control, getValues, setValue } = useFormContext<CrmPropertyFormValues>();
  const label = useWatch({ control, name: `options.${index}.label` });
  const saved = useWatch({ control, name: `options.${index}.saved` });
  const valuePath = `options.${index}.value` as const;
  const number = index + 1;
  // The value last made from the label. An appended choice counts as dirty from the start, so
  // "still following" means the value is still the one the label made.
  const madeFromLabel = useRef(keyFromLabel(label));

  useEffect(() => {
    const next = keyFromLabel(label);
    if (!saved && getValues(valuePath) === madeFromLabel.current) {
      setValue(valuePath, next);
    }
    madeFromLabel.current = next;
  }, [label, saved, valuePath, getValues, setValue]);

  return (
    <Flex
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems="flex-start"
      role="group"
      aria-label={t('Choice {number}', { number })}
    >
      <RhfTextField
        name={`options.${index}.label`}
        label="Choice"
        size="small"
        helperText="What people pick on the record, e.g. Enterprise."
      />
      <RhfTextField
        name={valuePath}
        label="Value"
        size="small"
        disabled={saved}
        helperText={saved ? 'Saved choices keep their value' : undefined}
      />
      <Flex direction="row" spacing={0.5}>
        <IconButton
          size="small"
          aria-label={t('Move choice {number} up', { number })}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label={t('Move choice {number} down', { number })}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          aria-label={t('Remove choice {number}', { number })}
          onClick={() => onRemove(index)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Flex>
    </Flex>
  );
}

/** The choices of a dropdown property, in the order the dropdown lists them. */
export function CrmPropertyOptionsFields() {
  const t = useT();
  const { control } = useFormContext<CrmPropertyFormValues>();
  const { fields, append, move, remove } = useFieldArray({ control, name: 'options' });

  return (
    <Flex direction="column" spacing={1.5}>
      <Text component="h3" size="label" weight="bold">
        {t('Choices')}
      </Text>
      <Text size="caption" color="text.secondary">
        {t(
          'Records store the value, so a saved choice can be renamed without touching them. Removing a choice leaves the records that hold it unchanged.',
        )}
      </Text>
      {fields.map((field, index) => (
        <OptionRow
          key={field.id}
          index={index}
          count={fields.length}
          onMove={move}
          onRemove={remove}
        />
      ))}
      <RhfFieldArrayError name="options" />
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => append({ label: '', value: '', saved: false })}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add choice')}
      </Button>
    </Flex>
  );
}
