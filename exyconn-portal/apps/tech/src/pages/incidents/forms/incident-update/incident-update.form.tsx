import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  IncidentUpdateStatus,
  useAddStatusIncidentUpdateMutation,
} from '@exyconn/shell/graphql/generated';
import { UPDATE_STATUS_OPTIONS } from '../../incidents.constants';
import type { IncidentUpdateFormProps } from './incident-update.types';

export const incidentUpdateSchema = z.object({
  status: z.nativeEnum(IncidentUpdateStatus),
  body: z
    .string()
    .trim()
    .min(10, 'Say what changed — at least 10 characters')
    .max(4000, 'Keep the update under 4000 characters'),
});

type Values = z.infer<typeof incidentUpdateSchema>;

/** Posts one timeline entry; RESOLVED closes the incident and alerts the team. */
export function IncidentUpdateForm({
  incident,
  onDone,
  onCancel,
}: Readonly<IncidentUpdateFormProps>) {
  const notify = useNotify();
  const [addUpdate] = useAddStatusIncidentUpdateMutation();
  const methods = useForm<z.input<typeof incidentUpdateSchema>, unknown, Values>({
    resolver: zodResolver(incidentUpdateSchema),
    defaultValues: { status: IncidentUpdateStatus.Identified, body: '' },
  });
  const chosen = methods.watch('status');

  const onSubmit = async (values: Values) => {
    try {
      await addUpdate({ variables: { id: incident.id, ...values } });
      notify(
        values.status === IncidentUpdateStatus.Resolved ? 'Incident resolved' : 'Update posted',
      );
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not post the update'), 'error');
    }
  };

  if (incident.resolvedAt) {
    return <Alert severity="info">This incident is resolved; its timeline is closed.</Alert>;
  }

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Post"
    >
      <Text size="sm" color="text.secondary">
        {incident.title}
      </Text>
      <RhfSelect name="status" label="Status" options={UPDATE_STATUS_OPTIONS} />
      <RhfTextField
        name="body"
        label="Update"
        multiline
        rows={4}
        helperText="Shown publicly on the status page, newest first"
      />
      {chosen === IncidentUpdateStatus.Resolved && (
        <Alert severity="warning">
          Resolving closes the incident and alerts Slack and the Tech team.
        </Alert>
      )}
    </EntityForm>
  );
}
