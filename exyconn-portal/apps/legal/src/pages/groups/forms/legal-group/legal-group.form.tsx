import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateLegalGroupMutation,
  useUpdateLegalGroupMutation,
  type LegalItemKind,
} from '@exyconn/shell/graphql/generated';
import {
  legalGroupSchema,
  toLegalGroupValues,
  type LegalGroupFormValues,
  type LegalGroupRow,
} from './legal-group.types';

interface LegalGroupFormProps {
  /** The register a new group is for; an existing group keeps its own. */
  kind: LegalItemKind;
  initial: LegalGroupRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or rename a group of contracts, policies or documents. */
export function LegalGroupForm({ kind, initial, onDone, onCancel }: Readonly<LegalGroupFormProps>) {
  const [createGroup] = useCreateLegalGroupMutation();
  const [updateGroup] = useUpdateLegalGroupMutation();
  const methods = useForm<LegalGroupFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(legalGroupSchema),
    defaultValues: toLegalGroupValues(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Group',
    initial,
    create: (values: LegalGroupFormValues) =>
      createGroup({ variables: { input: { ...values, kind } } }),
    update: (row, values) =>
      updateGroup({ variables: { id: row.id, input: { ...values, kind: row.kind } } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Name"
        required
        placeholder="e.g. Part Time Employee Contracts"
        helperText="What the set is, as HR will see it when handing it to an employee."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        minRows={3}
        helperText="Optional. Who this group is for and when to hand it over."
      />
    </EntityForm>
  );
}
