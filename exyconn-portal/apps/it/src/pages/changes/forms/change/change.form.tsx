import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfDateTimePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItChangeType,
  ItEnvironment,
  ItRisk,
  useCreateItChangeMutation,
  useUpdateItChangeMutation,
} from '@exyconn/shell/graphql/generated';
import {
  changeSchema,
  changeStatusOptions,
  toChangeValues,
  type ChangeValues,
} from './change.schema';
import type { ChangeRow } from './change.types';

const TYPE_OPTIONS = enumOptions(Object.values(ItChangeType));
const RISK_OPTIONS = enumOptions(Object.values(ItRisk));
const ENVIRONMENT_OPTIONS = enumOptions(Object.values(ItEnvironment));

interface ChangeFormProps {
  initial: ChangeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a planned change. Approval is its own action — the form only
 * moves a change through drafting, submission and what happened when it was carried out.
 */
export function ChangeForm({ initial, onDone, onCancel }: Readonly<ChangeFormProps>) {
  const [create] = useCreateItChangeMutation();
  const [update] = useUpdateItChangeMutation();
  const methods = useForm<ChangeValues>({
    resolver: zodResolver(changeSchema),
    defaultValues: toChangeValues(initial),
  });
  const statusOptions = enumOptions(changeStatusOptions(initial?.status ?? null));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Change',
    initial,
    create: (values: ChangeValues) => create({ variables: { input: values } }),
    update: (row, values) => update({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="system" label="System" helperText="e.g. Portal API, Office firewall" />
      <RhfTextField name="description" label="What will change" multiline rows={4} />
      <RhfSelect
        name="type"
        label="Type"
        options={TYPE_OPTIONS}
        helperText="A STANDARD change is pre-approved; the rest need approval first"
      />
      <RhfSelect name="risk" label="Risk" options={RISK_OPTIONS} />
      <RhfSelect name="environment" label="Environment" options={ENVIRONMENT_OPTIONS} />
      <RhfDateTimePicker name="plannedStart" label="Window starts" />
      <RhfDateTimePicker name="plannedEnd" label="Window ends" />
      <RhfSelect name="status" label="Status" options={statusOptions} />
      <RhfTextField name="ownerName" label="Owner" />
      <RhfTextField name="rollbackPlan" label="Rollback plan" multiline rows={3} />
    </EntityForm>
  );
}
