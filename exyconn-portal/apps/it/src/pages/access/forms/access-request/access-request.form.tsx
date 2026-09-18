import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfAutocomplete,
  RhfDatePicker,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItAccessKind,
  useCreateItAccessRequestMutation,
  useItSettingsQuery,
  useListAssetAssigneesQuery,
  useUpdateItAccessRequestMutation,
} from '@exyconn/shell/graphql/generated';
import {
  accessRequestSchema,
  LEVELLED_KINDS,
  toAccessRequestInput,
  toAccessRequestValues,
  type AccessRequestValues,
} from './access-request.schema';
import type { AccessRequestRow } from './access-request.types';

const KIND_OPTIONS = enumOptions(Object.values(ItAccessKind));

interface AccessRequestFormProps {
  initial: AccessRequestRow | null;
  /** The kind a new request starts as; the Password page fixes it to PASSWORD_RESET. */
  kind: ItAccessKind;
  /** Hide the kind picker when the screen only ever raises one kind. */
  lockKind?: boolean;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to ask IT to grant, change, revoke or reset access. The
 * applications come from IT Admin Settings, so a request always names something IT manages.
 */
export function AccessRequestForm({
  initial,
  kind,
  lockKind = false,
  onDone,
  onCancel,
}: Readonly<AccessRequestFormProps>) {
  const [create] = useCreateItAccessRequestMutation();
  const [update] = useUpdateItAccessRequestMutation();
  const { data: people } = useListAssetAssigneesQuery();
  const { data: settings } = useItSettingsQuery();
  const methods = useForm<AccessRequestValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: toAccessRequestValues(initial, kind),
  });
  const chosenKind = useWatch({ control: methods.control, name: 'kind' });
  const levelled = LEVELLED_KINDS.has(chosenKind);

  const employees = (people?.listAssetAssignees ?? []).map((person) => ({
    value: person.id,
    label: `${person.name} (${person.email})`,
  }));
  const applications = (settings?.itSettings.applications ?? []).map((app) => ({
    value: app,
    label: app,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Request',
    initial,
    create: (values: AccessRequestValues) =>
      create({ variables: { input: toAccessRequestInput(values) } }),
    update: (row, values) =>
      update({ variables: { id: row.id, input: toAccessRequestInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employees} />
      <RhfAutocomplete
        name="application"
        label="Application"
        options={applications}
        helperText={
          applications.length === 0 ? 'Add applications in IT Admin Settings first' : undefined
        }
      />
      {!lockKind && <RhfSelect name="kind" label="Request" options={KIND_OPTIONS} />}
      {levelled && (
        <RhfTextField name="accessLevel" label="Role or level" helperText="e.g. Viewer, Editor" />
      )}
      <RhfTextField name="reason" label="Reason" multiline rows={3} />
      {levelled && <RhfDatePicker name="expiresAt" label="Temporary until (optional)" />}
    </EntityForm>
  );
}
