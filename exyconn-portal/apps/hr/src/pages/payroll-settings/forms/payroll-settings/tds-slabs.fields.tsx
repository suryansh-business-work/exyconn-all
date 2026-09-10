import { useFieldArray, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

/**
 * The band table SLAB mode applies.
 *
 * No rates are supplied and none are suggested: slab boundaries, the standard deduction and
 * the cess change with every finance act, so a number shipped here would be wrong within the
 * year and wrong in a way that quietly under- or over-taxes people. The person who knows the
 * current table enters it.
 *
 * An empty table withholds nothing, which is the safe default — a portal nobody has
 * configured must not invent a rate to tax somebody at.
 */
export function TdsSlabFields() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'tdsSlabs' });

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" weight="bold">
        Tax bands
      </Text>
      <Text size="caption" color="text.secondary">
        Each band&apos;s rate applies only to the part of annual taxable pay that falls inside it.
        Leave the last band&apos;s upper limit empty — that is the open-ended top band. With no
        bands, nothing is withheld.
      </Text>

      {fields.map((field, index) => (
        <Flex key={field.id} direction="row" spacing={1} alignItems="flex-start">
          <RhfTextField
            name={`tdsSlabs.${index}.upTo`}
            label="Up to (annual)"
            type="number"
            helperText={index === fields.length - 1 ? 'Empty = everything above' : undefined}
          />
          <RhfTextField name={`tdsSlabs.${index}.percent`} label="Rate (%)" type="number" />
          <IconButton
            aria-label={`Remove band ${index + 1}`}
            onClick={() => remove(index)}
            sx={{ mt: 1 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Flex>
      ))}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => append({ upTo: null, percent: 0 })}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add band
      </Button>
    </Flex>
  );
}
