import { useFieldArray, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useCountryOptions } from '@exyconn/shell/components/localization';

/** A new row: no country yet, nothing granted, offered. */
const NEW_OVERRIDE = { country: '', annualQuota: 0, carryForwardCap: 0, active: true };

/**
 * One row per country whose terms differ from the global ones above. A country with no row
 * gets the global quota; a row states that country's terms in full, and "Offered" can switch
 * the type on for one country even when it is off globally.
 */
export function CountryOverrideFields() {
  const t = useT();
  const countries = useCountryOptions();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'overrides' });

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" weight="bold">
        {t('Country overrides')}
      </Text>
      <Text size="caption" color="text.secondary">
        {t(
          'Employees in a listed country get that row instead of the global quota. To offer this leave in one country only, switch Active off above and add that country here.',
        )}
      </Text>

      {fields.map((field, index) => (
        <Flex key={field.id} direction="row" spacing={1} alignItems="flex-start">
          <RhfAutocomplete
            name={`overrides.${index}.country`}
            label="Country"
            options={countries}
          />
          <RhfTextField
            name={`overrides.${index}.annualQuota`}
            label="Annual quota (days)"
            type="number"
          />
          <RhfTextField
            name={`overrides.${index}.carryForwardCap`}
            label="Carry-forward cap"
            type="number"
          />
          <RhfSwitch name={`overrides.${index}.active`} label="Offered" />
          <IconButton
            aria-label={t('Remove override {number}', { number: index + 1 })}
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
        onClick={() => append(NEW_OVERRIDE)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add country override')}
      </Button>
    </Flex>
  );
}
