import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { ItIncidentStatus, useAddItIncidentUpdateMutation } from '@exyconn/shell/graphql/generated';
import type { IncidentUpdateValues } from './incident-update.types';

const STATUS_OPTIONS = enumOptions(Object.values(ItIncidentStatus));

export const incidentUpdateSchema = z.object({
  status: z.nativeEnum(ItIncidentStatus),
  note: z.string().trim().min(3, 'Say what happened').max(2000, 'Too long'),
});

interface IncidentUpdateFormProps {
  incidentId: string;
  status: ItIncidentStatus;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form that appends one entry to an incident's timeline. */
export function IncidentUpdateForm({
  incidentId,
  status,
  onDone,
  onCancel,
}: Readonly<IncidentUpdateFormProps>) {
  const notify = useNotify();
  const [addUpdate] = useAddItIncidentUpdateMutation();
  const methods = useForm<IncidentUpdateValues>({
    resolver: zodResolver(incidentUpdateSchema),
    defaultValues: { status, note: '' },
  });

  const onSubmit = async (values: IncidentUpdateValues) => {
    try {
      await addUpdate({ variables: { id: incidentId, ...values } });
      notify('Update posted');
      methods.reset({ status: values.status, note: '' });
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not post the update'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Post update"
    >
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="note" label="What happened" multiline rows={3} />
    </EntityForm>
  );
}
