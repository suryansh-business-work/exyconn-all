import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateCostCenterMutation,
  useUpdateCostCenterMutation,
} from '@exyconn/shell/graphql/generated';
import type { CostCenterRow } from './cost-center.types';

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(12, 'Keep the code short — it is quoted, not read')
    .regex(/^[A-Za-z0-9-]+$/, 'Letters, digits and hyphens only'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CostCenterRow | null): Values => ({
  code: row?.code ?? '',
  name: row?.name ?? '',
  description: row?.description ?? '',
  isActive: row?.isActive ?? true,
});

interface CostCenterFormProps {
  initial: CostCenterRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a cost centre.
 *
 * There is no delete-by-retiring shortcut here: `isActive` stops a centre being picked for
 * new spend while leaving every bill and budget already booked to it readable, which is why
 * the switch exists instead of people deleting centres they have finished with.
 */
export function CostCenterForm({ initial, onDone, onCancel }: Readonly<CostCenterFormProps>) {
  const [createCostCenter] = useCreateCostCenterMutation();
  const [updateCostCenter] = useUpdateCostCenterMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Cost centre',
    initial,
    create: (values: Values) => createCostCenter({ variables: { input: values } }),
    update: (row, values) => updateCostCenter({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="code" label="Code" helperText="Short key finance quotes — ENG, MKT" />
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="description" label="Description" multiline rows={2} />
      <RhfSwitch name="isActive" label="Active" />
    </EntityForm>
  );
}
