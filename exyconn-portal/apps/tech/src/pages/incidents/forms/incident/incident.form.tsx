import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfMultiSelect, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  IncidentImpact,
  useCreateStatusIncidentMutation,
  useListStatusMonitorsQuery,
} from '@exyconn/shell/graphql/generated';
import { IMPACT_OPTIONS } from '../../incidents.constants';
import type { IncidentFormProps, IncidentFormValues } from './incident.types';

export const incidentSchema = z.object({
  title: z.string().trim().min(5, 'Give the incident a title').max(120, 'Keep the title short'),
  impact: z.nativeEnum(IncidentImpact),
  affectedServiceKeys: z.array(z.string()).min(1, 'Choose at least one affected service'),
  body: z
    .string()
    .trim()
    .min(10, 'Say what is known so far — at least 10 characters')
    .max(4000, 'Keep the update under 4000 characters'),
});

type Values = z.infer<typeof incidentSchema>;

export const INCIDENT_DEFAULTS: IncidentFormValues = {
  title: '',
  impact: IncidentImpact.Major,
  affectedServiceKeys: [],
  body: '',
};

/** Opens an incident a person noticed, with the first "investigating" update. */
export function IncidentForm({ onDone, onCancel }: Readonly<IncidentFormProps>) {
  const [createIncident] = useCreateStatusIncidentMutation();
  const { data } = useListStatusMonitorsQuery();
  const methods = useForm<z.input<typeof incidentSchema>, unknown, Values>({
    resolver: zodResolver(incidentSchema),
    defaultValues: INCIDENT_DEFAULTS,
  });

  const services = (data?.listStatusMonitors ?? []).map((monitor) => ({
    value: monitor.key,
    label: monitor.name,
  }));

  const { onSubmit } = useEntitySave({
    label: 'Incident',
    initial: null,
    create: (values: Values) => createIncident({ variables: { input: values } }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={false} onCancel={onCancel}>
      <RhfTextField
        name="title"
        label="Title"
        helperText="Shown as the headline on the status page"
      />
      <RhfSelect name="impact" label="Impact" options={IMPACT_OPTIONS} />
      <RhfMultiSelect name="affectedServiceKeys" label="Affected services" options={services} />
      <RhfTextField
        name="body"
        label="What do we know?"
        multiline
        rows={4}
        helperText="Posted as the first update, marked Investigating"
      />
    </EntityForm>
  );
}
