import { useFieldArray, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import {
  RhfCurrencyField,
  RhfFieldArrayError,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';

/** The plan's price in each currency it is sold in. None at all makes it free. */
export function PlanPriceFields() {
  const t = useT();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'prices' });

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" weight="bold">
        {t('Prices')}
      </Text>
      <Text size="caption" color="text.secondary">
        {t('One per currency, charged every interval. Leave none for a free plan.')}
      </Text>
      {fields.map((field, index) => (
        <Flex key={field.id} direction="row" spacing={1} alignItems="flex-start">
          <RhfCurrencyField name={`prices.${index}.currency`} defaultToCompany={false} />
          <RhfTextField
            name={`prices.${index}.amount`}
            label="Amount"
            type="number"
            helperText="In the currency's main unit."
          />
          <IconButton
            aria-label={t('Remove price {number}', { number: index + 1 })}
            onClick={() => remove(index)}
            sx={{ mt: 1 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Flex>
      ))}
      <RhfFieldArrayError name="prices" />
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => append({ currency: '', amount: 0 })}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add price')}
      </Button>
    </Flex>
  );
}
