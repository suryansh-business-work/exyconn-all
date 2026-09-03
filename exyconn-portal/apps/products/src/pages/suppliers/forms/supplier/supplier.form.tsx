import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupplierStatus,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from '@exyconn/shell/graphql/generated';
import type { SupplierRow } from './supplier.types';

const STATUS_OPTIONS = enumOptions(Object.values(SupplierStatus));

/** The short reference that goes on a purchase order: letters, digits and dashes. */
const CODE_PATTERN = /^[A-Z0-9-]+$/;

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Code is required')
    .max(12, 'Keep the code short — it goes on purchase orders')
    .regex(CODE_PATTERN, 'Use letters, digits and dashes only'),
  contactName: z.string().trim(),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]),
  phone: z.string().trim(),
  status: z.nativeEnum(SupplierStatus),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: SupplierRow | null): Values => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  contactName: row?.contactName ?? '',
  email: row?.email ?? '',
  phone: row?.phone ?? '',
  status: row?.status ?? SupplierStatus.Active,
  notes: row?.notes ?? '',
});

interface SupplierFormProps {
  initial: SupplierRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a supplier. */
export function SupplierForm({ initial, onDone, onCancel }: Readonly<SupplierFormProps>) {
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Supplier',
    initial,
    create: (values: Values) => createSupplier({ variables: { input: values } }),
    update: (row, values) => updateSupplier({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Supplier name" />
      <RhfTextField name="code" label="Code" helperText="Short reference, e.g. ACME-01" />
      <RhfTextField name="contactName" label="Contact" />
      <RhfTextField name="email" label="Email" type="email" />
      <RhfTextField name="phone" label="Phone" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
