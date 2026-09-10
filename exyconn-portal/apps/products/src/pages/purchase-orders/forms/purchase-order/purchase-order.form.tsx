import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid } from '@exyconn/shell/components/ui';
import { RhfDatePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  PurchaseOrderStatus,
  useCreatePurchaseOrderMutation,
  useListProductsQuery,
  useListSuppliersQuery,
  useUpdatePurchaseOrderMutation,
} from '@exyconn/shell/graphql/generated';
import { PurchaseOrderLinesFields } from './purchase-order-lines.fields';
import type { PurchaseOrderRow } from './purchase-order.types';

const lineSchema = z.object({
  productId: z.string().trim().min(1, 'Choose a product'),
  quantity: z.coerce
    .number({ message: 'Must be a number' })
    .int('Whole units only')
    .min(1, 'At least 1'),
  unitCost: z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  taxPercent: z.coerce
    .number({ message: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
});

const schema = z.object({
  supplierId: z.string().trim().min(1, 'Choose a supplier'),
  // An order for nothing cannot be received, so it cannot be raised either.
  lines: z.array(lineSchema).min(1, 'Add at least one line'),
  currency: z.string().trim().min(1, 'Currency is required'),
  status: z.nativeEnum(PurchaseOrderStatus),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDate: z.string(),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PurchaseOrderRow | null): Values => ({
  supplierId: row?.supplierId ?? '',
  lines: (row?.lines ?? []).map(({ productId, quantity, unitCost, taxPercent }) => ({
    productId,
    quantity,
    unitCost,
    taxPercent,
  })),
  currency: row?.currency ?? 'INR',
  status: row?.status ?? PurchaseOrderStatus.Draft,
  orderDate: row?.orderDate ?? '',
  expectedDate: row?.expectedDate ?? '',
  notes: row?.notes ?? '',
});

interface PurchaseOrderFormProps {
  initial: PurchaseOrderRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * What we are ordering from a supplier, and what we agreed to pay for it.
 *
 * The number is not on this form — it is drawn from the shared counter on save, because a
 * series with a repeat in it makes a receipt impossible to attribute. Received quantities are
 * not here either: they are written by booking goods in, never typed, which is what stops
 * stock existing on a screen and not on a shelf.
 */
export function PurchaseOrderForm({ initial, onDone, onCancel }: Readonly<PurchaseOrderFormProps>) {
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const { data: suppliersData } = useListSuppliersQuery();
  const { data: productsData } = useListProductsQuery();
  const [createOrder] = useCreatePurchaseOrderMutation();
  const [updateOrder] = useUpdatePurchaseOrderMutation();

  const supplierOptions = (suppliersData?.listSuppliers ?? []).map((supplier) => ({
    value: supplier.id,
    label: `${supplier.name} (${supplier.code})`,
  }));
  const productOptions = (productsData?.listProducts ?? []).map((product) => ({
    value: product.id,
    label: `${product.name} — ${product.sku}`,
  }));

  /** An empty expected date means "nobody asked", which the server stores as null. */
  const toInput = (values: Values) => ({ ...values, expectedDate: values.expectedDate || null });

  const save = useEntitySave<Values, PurchaseOrderRow>({
    label: 'Purchase order',
    initial,
    create: (values) => createOrder({ variables: { input: toInput(values) } }),
    update: (row, values) => updateOrder({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={save.onSubmit} isEdit={save.isEdit} onCancel={onCancel}>
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 6
          }}>
          <RhfSelect name="supplierId" label="Supplier" options={supplierOptions} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6
          }}>
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(PurchaseOrderStatus))}
          />
        </Grid>
      </Grid>
      <PurchaseOrderLinesFields products={productOptions} />
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <RhfTextField name="currency" label="Currency" />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <RhfDatePicker name="orderDate" label="Ordered on" />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4
          }}>
          <RhfDatePicker name="expectedDate" label="Expected (optional)" />
        </Grid>
      </Grid>
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
