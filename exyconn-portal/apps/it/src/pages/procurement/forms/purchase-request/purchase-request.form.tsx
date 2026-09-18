import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItPurchaseKind,
  useCreateItPurchaseRequestMutation,
  useUpdateItPurchaseRequestMutation,
} from '@exyconn/shell/graphql/generated';
import {
  purchaseRequestSchema,
  purchaseStatusOptions,
  toPurchaseRequestValues,
  type PurchaseRequestValues,
} from './purchase-request.schema';
import { PurchaseQuotesFields } from './purchase-quotes.fields';
import type { PurchaseRequestRow } from './purchase-request.types';

const KIND_OPTIONS = enumOptions(Object.values(ItPurchaseKind));

interface PurchaseRequestFormProps {
  initial: PurchaseRequestRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a hardware, software or service purchase: the ask, the
 * quotes gathered for it, and — after approval — the order and its delivery.
 */
export function PurchaseRequestForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PurchaseRequestFormProps>) {
  const [create] = useCreateItPurchaseRequestMutation();
  const [update] = useUpdateItPurchaseRequestMutation();
  const methods = useForm<z.input<typeof purchaseRequestSchema>, unknown, PurchaseRequestValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: toPurchaseRequestValues(initial),
  });
  const statusOptions = enumOptions(purchaseStatusOptions(initial?.status ?? null));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Purchase request',
    initial,
    create: (values: PurchaseRequestValues) => create({ variables: { input: values } }),
    update: (row, values) => update({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="What is being bought" helperText="e.g. MacBook Pro 14" />
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} />
      <RhfTextField name="quantity" label="Quantity" type="number" />
      <RhfTextField name="estimatedCost" label="Estimated total cost" type="number" />
      <RhfTextField name="requestedForName" label="For whom" helperText="Empty when it is for IT" />
      <RhfTextField name="justification" label="Why it is needed" multiline rows={3} />
      <PurchaseQuotesFields />
      <RhfSelect
        name="status"
        label="Status"
        options={statusOptions}
        helperText="Approval is its own action. Ordering needs it approved first."
      />
      <RhfTextField name="orderReference" label="Supplier order reference" />
    </EntityForm>
  );
}
