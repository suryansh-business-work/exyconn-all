import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Flex, Grid, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { lineCost, linesTotal, type PurchaseOrderLineValues } from './purchase-order.types';

interface LineRowProps {
  index: number;
  cost: string;
  products: SelectOption[];
  onRemove: () => void;
}

/** One ordered line. Hoisted to module scope — never defined inside its parent. */
function LineRow({ index, cost, products, onRemove }: Readonly<LineRowProps>) {
  return (
    <Grid
      container
      spacing={1}
      sx={{
        alignItems: "center",
        mb: 1
      }}>
      <Grid
        size={{
          xs: 12,
          sm: 4
        }}>
        <RhfSelect name={`lines.${index}.productId`} label="Product" options={products} />
      </Grid>
      <Grid
        size={{
          xs: 4,
          sm: 2
        }}>
        <RhfTextField name={`lines.${index}.quantity`} label="Qty" type="number" />
      </Grid>
      <Grid
        size={{
          xs: 4,
          sm: 2
        }}>
        <RhfTextField name={`lines.${index}.unitCost`} label="Unit cost" type="number" />
      </Grid>
      <Grid
        size={{
          xs: 4,
          sm: 2
        }}>
        <RhfTextField name={`lines.${index}.taxPercent`} label="Tax %" type="number" />
      </Grid>
      <Grid
        size={{
          xs: 10,
          sm: 1
        }}>
        <Text size="sm">{cost}</Text>
      </Grid>
      <Grid
        size={{
          xs: 2,
          sm: 1
        }}>
        <IconButton aria-label="Remove line" onClick={onRemove} size="small">
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Grid>
    </Grid>
  );
}

const EMPTY_LINE: PurchaseOrderLineValues = {
  productId: '',
  quantity: 1,
  unitCost: 0,
  taxPercent: 0,
};

/**
 * The ordered lines, and what they will cost.
 *
 * The unit cost is the field that matters: it is what the received stock is valued at, and
 * without it inventory can only be priced at what we hope to sell for.
 */
export function PurchaseOrderLinesFields({ products }: Readonly<{ products: SelectOption[] }>) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const drafts = (useWatch({ control, name: 'lines' }) ?? []) as PurchaseOrderLineValues[];

  const normalised = drafts.map((line) => ({
    productId: line?.productId ?? '',
    quantity: Number(line?.quantity ?? 0),
    unitCost: Number(line?.unitCost ?? 0),
    taxPercent: Number(line?.taxPercent ?? 0),
  }));

  return (
    <Box>
      <Text size="sm" weight="bold" sx={{ display: 'block', mb: 1 }}>
        Lines
      </Text>
      {fields.map((field, index) => (
        <LineRow
          key={field.id}
          index={index}
          products={products}
          cost={String(lineCost(normalised[index] ?? EMPTY_LINE))}
          onRemove={() => remove(index)}
        />
      ))}
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => append({ ...EMPTY_LINE })}>
          Add line
        </Button>
        <Text size="sm" weight="bold">
          Total {linesTotal(normalised).toLocaleString()}
        </Text>
      </Flex>
    </Box>
  );
}
