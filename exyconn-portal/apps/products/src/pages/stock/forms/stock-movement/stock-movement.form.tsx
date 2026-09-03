import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  MovementReason,
  useListProductsQuery,
  useListSuppliersQuery,
  useRecordStockMovementMutation,
} from '@exyconn/shell/graphql/generated';

const REASON_OPTIONS = enumOptions(Object.values(MovementReason));

/** Reasons that take stock off the shelf, mirrored from the server. */
const OUTGOING: ReadonlySet<string> = new Set([MovementReason.Issue, MovementReason.WriteOff]);

const schema = z.object({
  productId: z.string().trim().min(1, 'Choose a product'),
  reason: z.nativeEnum(MovementReason),
  quantity: z.coerce
    .number({ message: 'Quantity must be a number' })
    .int('Whole units only')
    .min(1, 'Quantity must be at least 1'),
  supplierId: z.string().trim(),
  reference: z.string().trim(),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

interface StockMovementFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/** Explains what the chosen reason will do to the level, before it is recorded. */
function effectOf(reason: string, quantity: number, current: number | undefined): string {
  if (current === undefined) {
    return 'Choose a product to see the effect.';
  }
  if (reason === MovementReason.Count) {
    return `Stocktake: the level becomes ${quantity}.`;
  }
  const after = OUTGOING.has(reason) ? current - quantity : current + quantity;
  return `${current} → ${after}`;
}

/** React Hook Form + Zod form to record a stock movement. */
export function StockMovementForm({ onDone, onCancel }: Readonly<StockMovementFormProps>) {
  const notify = useNotify();
  const { data: productsData } = useListProductsQuery();
  const { data: suppliersData } = useListSuppliersQuery();
  const [record] = useRecordStockMovementMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: '',
      reason: MovementReason.Receipt,
      quantity: 1,
      supplierId: '',
      reference: '',
      notes: '',
    },
  });

  const [productId, reason, quantity] = useWatch({
    control: methods.control,
    name: ['productId', 'reason', 'quantity'],
  });

  const products = productsData?.listProducts ?? [];
  const productOptions: SelectOption[] = products.map((p) => ({
    value: p.id,
    label: `${p.name} — ${p.stock} in stock`,
  }));
  const supplierOptions: SelectOption[] = (suppliersData?.listSuppliers ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name}`,
  }));
  const current = products.find((p) => p.id === productId)?.stock;

  const onSubmit = async (values: Values) => {
    try {
      const result = await record({ variables: { input: values } });
      notify(`Recorded. Stock is now ${result.data?.recordStockMovement.stockAfter ?? '—'}.`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not record the movement', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Record"
    >
      <RhfSelect name="productId" label="Product" options={productOptions} />
      <RhfSelect name="reason" label="Reason" options={REASON_OPTIONS} />
      <RhfTextField name="quantity" label="Quantity" type="number" />
      <Text size="sm" color="text.secondary">
        {effectOf(String(reason), Number(quantity) || 0, current)}
      </Text>
      <RhfSelect name="supplierId" label="Supplier" options={supplierOptions} />
      <RhfTextField name="reference" label="Reference" helperText="PO number, invoice, ticket…" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
