import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
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
    mode: 'onTouched',
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
      <RhfTextField
        name="title"
        label="Title"
        helperText="A short name for the change, e.g. Upgrade the database to version 7."
      />
      <RhfTextField name="system" label="System" helperText="e.g. Portal API, Office firewall" />
      <RhfTextField
        name="description"
        label="What will change"
        multiline
        rows={4}
        helperText="The steps and what users will notice, so approvers can judge it."
      />
      <RhfSelect
        name="type"
        label="Type"
        options={TYPE_OPTIONS}
        helperText="A STANDARD change is pre-approved; the rest need approval first"
      />
      <RhfSelect
        name="risk"
        label="Risk"
        options={RISK_OPTIONS}
        helperText="How likely it is to cause trouble. Medium or high in production needs a rollback plan."
      />
      <RhfSelect
        name="environment"
        label="Environment"
        options={ENVIRONMENT_OPTIONS}
        helperText="Where the change is made: production, staging or development."
      />
      <RhfDateTimePicker
        name="plannedStart"
        label="Window starts"
        helperText="When the work is due to begin."
      />
      <RhfDateTimePicker
        name="plannedEnd"
        label="Window ends"
        helperText="When the work should be finished; must be after the start."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={statusOptions}
        helperText="Where the change stands. Approval and rejection are recorded with their own action."
      />
      <RhfTextField
        name="ownerName"
        label="Owner"
        helperText="Optional. The person carrying out the change."
      />
      <RhfTextField
        name="rollbackPlan"
        label="Rollback plan"
        multiline
        rows={3}
        helperText="How to undo the change if it goes wrong. Required for medium or high risk in production."
      />
    </EntityForm>
  );
}
