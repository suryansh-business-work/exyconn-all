import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateClientLinkMutation,
  useUpdateClientLinkMutation,
} from '@exyconn/shell/graphql/generated';
import {
  clientLinkDefaults,
  clientLinkSchema,
  type ClientLinkFormValues,
  type ClientLinkRow,
} from './client-link.types';

interface ClientLinkFormProps {
  clientId: string;
  initial: ClientLinkRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Adds or edits an important link the client sees in their hub. */
export function ClientLinkForm({
  clientId,
  initial,
  onDone,
  onCancel,
}: Readonly<ClientLinkFormProps>) {
  const [createLink] = useCreateClientLinkMutation();
  const [updateLink] = useUpdateClientLinkMutation();
  const methods = useForm<ClientLinkFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(clientLinkSchema),
    defaultValues: clientLinkDefaults(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Link',
    initial,
    create: (values: ClientLinkFormValues) =>
      createLink({ variables: { clientId, input: values } }),
    // An edit never re-announces the link: notify is offered on create only.
    update: (row, values) =>
      updateLink({
        variables: {
          id: row.id,
          input: {
            title: values.title,
            url: values.url,
            description: values.description,
            details: values.details,
          },
        },
      }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="title"
        label="Title"
        helperText="What the client will look for, e.g. Staging site"
      />
      <RhfTextField
        name="url"
        label="Address"
        type="url"
        helperText="The full address, starting with https://"
      />
      <RhfTextField
        name="description"
        label="Description"
        helperText="One line on what it is for"
      />
      <RhfTextField
        name="details"
        label="Details"
        multiline
        minRows={3}
        helperText="Anything else: how to sign in, who owns it, what to look at first"
      />
      {!isEdit && <RhfSwitch name="notify" label="Email the client's hub contacts about it" />}
    </EntityForm>
  );
}
