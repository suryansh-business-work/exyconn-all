import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfDateTimePicker,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ClientCommunicationType,
  useCreateClientCommunicationMutation,
  useUpdateClientCommunicationMutation,
} from '@exyconn/shell/graphql/generated';
import {
  clientCommunicationDefaults,
  clientCommunicationSchema,
  type ClientCommunicationFormValues,
  type ClientCommunicationRow,
} from './client-communication.types';

const TYPE_OPTIONS = enumOptions(Object.values(ClientCommunicationType));

interface ClientCommunicationFormProps {
  clientId: string;
  initial: ClientCommunicationRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Logs a call, email, meeting or message with the client — or corrects one. The client reads
 * the same log in their hub; "Email the client" tells their hub contacts, once per entry.
 */
export function ClientCommunicationForm({
  clientId,
  initial,
  onDone,
  onCancel,
}: Readonly<ClientCommunicationFormProps>) {
  const [createEntry] = useCreateClientCommunicationMutation();
  const [updateEntry] = useUpdateClientCommunicationMutation();
  const methods = useForm<ClientCommunicationFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(clientCommunicationSchema),
    defaultValues: clientCommunicationDefaults(initial, new Date()),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Communication',
    initial,
    create: (input: ClientCommunicationFormValues) =>
      createEntry({ variables: { clientId, input } }),
    update: (row, input) => updateEntry({ variables: { id: row.id, input } }),
    onDone,
  });
  const alreadyNotified = Boolean(initial?.notifiedAt);

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfSelect name="type" label="Type" options={TYPE_OPTIONS} />
      <RhfDateTimePicker name="occurredAt" label="When" />
      <RhfTextField name="subject" label="Subject" helperText="What it was about, in a few words" />
      <RhfTextField
        name="participants"
        label="Who took part"
        helperText="For example: Dana Reyes, Arjun from our team"
      />
      <RhfTextField
        name="summary"
        label="Summary"
        multiline
        minRows={2}
        helperText="What was said and agreed"
      />
      <RhfTextField
        name="details"
        label="Details"
        multiline
        minRows={3}
        helperText="Anything longer: notes, next steps"
      />
      {!alreadyNotified && (
        <RhfSwitch name="notify" label="Email the client's hub contacts about it" />
      )}
    </EntityForm>
  );
}
