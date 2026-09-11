import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { formatMoney } from '@exyconn/shell/utils/money';
import { lineAmount, linesTotal, type InvoiceLineValues } from './invoice.types';

const EMPTY_LINE: InvoiceLineValues = {
  description: '',
  quantity: 1,
  rate: 0,
  taxPercent: 0,
  hsnSac: '',
};

/** The lines as they are being typed: numbers may still be strings until Zod coerces them. */
type DraftLine = { [K in keyof InvoiceLineValues]: InvoiceLineValues[K] | string };

const toLine = (draft: DraftLine): InvoiceLineValues => ({
  description: String(draft.description ?? ''),
  quantity: Number(draft.quantity) || 0,
  rate: Number(draft.rate) || 0,
  taxPercent: Number(draft.taxPercent) || 0,
  hsnSac: String(draft.hsnSac ?? ''),
});

interface LineRowProps {
  index: number;
  amount: string;
  onRemove: () => void;
}

/** One editable line: what, how many, at what rate, at what tax — and what that comes to. */
function LineRow({ index, amount, onRemove }: Readonly<LineRowProps>) {
  return (
    <Flex direction="row" spacing={1} alignItems="flex-start">
      <RhfTextField name={`lines.${index}.description`} label="Description" size="small" />
      <RhfTextField
        name={`lines.${index}.hsnSac`}
        label="HSN/SAC"
        size="small"
        sx={{ maxWidth: 100 }}
      />
      <RhfTextField
        name={`lines.${index}.quantity`}
        label="Qty"
        type="number"
        size="small"
        sx={{ maxWidth: 80 }}
      />
      <RhfTextField
        name={`lines.${index}.rate`}
        label="Rate"
        type="number"
        size="small"
        sx={{ maxWidth: 110 }}
      />
      <RhfTextField
        name={`lines.${index}.taxPercent`}
        label="Tax %"
        type="number"
        size="small"
        sx={{ maxWidth: 80 }}
      />
      <Text size="sm" sx={{ minWidth: 90, textAlign: 'right', pt: 1.25 }}>
        {amount}
      </Text>
      <IconButton aria-label="remove line" size="small" onClick={onRemove}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

/**
 * The invoice's lines, with a live total.
 *
 * The total shown here is the same arithmetic the server settles the amount on, so what
 * Finance sees while typing is what the client will be billed. An invoice with no lines
 * falls back to the single typed amount, for the invoices written before lines existed.
 */
export function InvoiceLinesFields({ currency }: Readonly<{ currency: string }>) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const drafts = (useWatch({ control, name: 'lines' }) ?? []) as DraftLine[];
  const lines = drafts.map(toLine);
  const total = linesTotal(lines);

  return (
    <Flex direction="column" spacing={1.5}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Text size="sm" sx={{ fontWeight: 600, flex: 1 }}>
          Lines
        </Text>
        <Button size="small" startIcon={<AddIcon />} onClick={() => append(EMPTY_LINE)}>
          Add line
        </Button>
      </Flex>
      {fields.map((field, index) => (
        <LineRow
          key={field.id}
          index={index}
          amount={formatMoney(lineAmount(lines[index] ?? EMPTY_LINE), currency)}
          onRemove={() => remove(index)}
        />
      ))}
      {fields.length > 0 ? (
        <Text size="sm" sx={{ textAlign: 'right', fontWeight: 600 }}>
          Total {formatMoney(total, currency)}
        </Text>
      ) : (
        <RhfTextField
          name="amount"
          label="Amount"
          type="number"
          helperText="Used when the invoice has no lines"
        />
      )}
    </Flex>
  );
}
