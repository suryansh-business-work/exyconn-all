import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  LeadSource,
  LeadStage,
  useCreateLeadMutation,
  useUpdateLeadMutation,
} from '@exyconn/shell/graphql/generated';
import type { LeadRow } from './lead.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  source: z.nativeEnum(LeadSource),
  stage: z.nativeEnum(LeadStage),
  value: z.coerce.number({ message: 'Value must be a number' }).min(0, 'Must be ≥ 0'),
  owner: z.string().trim().min(1, 'Owner is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LeadRow | null): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  source: row?.source ?? LeadSource.Website,
  stage: row?.stage ?? LeadStage.New,
  value: row?.value ?? 0,
  owner: row?.owner ?? '',
});

interface LeadFormProps {
  initial: LeadRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a lead. */
export function LeadForm({ initial, onDone, onCancel }: LeadFormProps) {
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Lead',
    initial,
    create: (values: Values) => createLead({ variables: { input: values } }),
    update: (row, values) => updateLead({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="email" label="Email" type="email" />
      <RhfSelect name="source" label="Source" options={enumOptions(Object.values(LeadSource))} />
      <RhfSelect name="stage" label="Stage" options={enumOptions(Object.values(LeadStage))} />
      <RhfTextField name="value" label="Value" type="number" />
      <RhfTextField name="owner" label="Owner" />
    </EntityForm>
  );
}
