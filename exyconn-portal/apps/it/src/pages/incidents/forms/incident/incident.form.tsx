import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfChipsInput,
  RhfDateTimePicker,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
  useCreateItIncidentMutation,
  useUpdateItIncidentMutation,
} from '@exyconn/shell/graphql/generated';
import {
  incidentSchema,
  toIncidentInput,
  toIncidentValues,
  type IncidentValues,
} from './incident.schema';
import { IncidentFollowUpsFields } from './incident-follow-ups.fields';
import type { IncidentRow } from './incident.types';

const SEVERITY_OPTIONS = enumOptions(Object.values(ItIncidentSeverity));
const CATEGORY_OPTIONS = enumOptions(Object.values(ItIncidentCategory));
const STATUS_OPTIONS = enumOptions(Object.values(ItIncidentStatus));

interface IncidentFormProps {
  initial: IncidentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for an incident: what is wrong and how badly, then — once it is
 * over — the root cause and the actions that stop it happening again. The timeline is written
 * by status changes and updates, never edited here.
 */
export function IncidentForm({ initial, onDone, onCancel }: Readonly<IncidentFormProps>) {
  const [create] = useCreateItIncidentMutation();
  const [update] = useUpdateItIncidentMutation();
  const methods = useForm<IncidentValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: toIncidentValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Incident',
    initial,
    create: (values: IncidentValues) => create({ variables: { input: toIncidentInput(values) } }),
    update: (row, values) => update({ variables: { id: row.id, input: toIncidentInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" helperText="e.g. VPN unreachable for all staff" />
      <RhfTextField name="description" label="What is happening" multiline rows={3} />
      <RhfSelect name="severity" label="Severity" options={SEVERITY_OPTIONS} />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfDateTimePicker name="startedAt" label="Started" />
      <RhfTextField
        name="impact"
        label="Impact"
        helperText="Who and what is affected"
        multiline
        rows={2}
      />
      <RhfChipsInput
        name="affectedSystems"
        label="Affected systems"
        helperText="Press Enter after each"
      />
      <RhfTextField name="commanderName" label="Incident commander" />
      <RhfTextField name="rootCause" label="Root cause (RCA)" multiline rows={3} />
      <IncidentFollowUpsFields />
    </EntityForm>
  );
}
