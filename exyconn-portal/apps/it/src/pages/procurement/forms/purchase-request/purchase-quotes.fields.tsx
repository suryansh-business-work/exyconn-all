import { useFieldArray, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Button, Grid, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { QuoteValues } from './purchase-request.types';

const EMPTY_QUOTE: QuoteValues = { vendor: '', amount: 0, notes: '' };

/** One vendor's quote. Hoisted to module scope — never defined inside its parent. */
function QuoteRow({ index, onRemove }: Readonly<{ index: number; onRemove: () => void }>) {
  const t = useT();
  return (
    <Grid container spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <RhfTextField name={`quotes.${index}.vendor`} label="Vendor" />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <RhfTextField name={`quotes.${index}.amount`} label="Amount" type="number" />
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <RhfTextField name={`quotes.${index}.notes`} label="Notes" />
      </Grid>
      <Grid size={{ xs: 12, sm: 1 }}>
        <IconButton aria-label={t('Remove quote')} onClick={onRemove} size="small">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Grid>
    </Grid>
  );
}

/** The quotes gathered for a request; the cheapest is what the spend report counts. */
export function PurchaseQuotesFields() {
  const t = useT();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'quotes' });
  return (
    <Box>
      <Text size="sm" weight="bold" sx={{ display: 'block', mb: 1 }}>
        {t('Quotes')}
      </Text>
      {fields.map((field, index) => (
        <QuoteRow key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => append({ ...EMPTY_QUOTE })}>
        {t('Add quote')}
      </Button>
    </Box>
  );
}
