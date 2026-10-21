import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfAutocomplete,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ClientSharedKind,
  useClientShareOptionsQuery,
  useShareWithClientMutation,
} from '@exyconn/shell/graphql/generated';
import {
  shareWithClientDefaults,
  shareWithClientSchema,
  type ShareWithClientFormValues,
} from './share-with-client.types';

const KIND_OPTIONS = enumOptions(Object.values(ClientSharedKind));

interface ShareWithClientFormProps {
  clientId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Shares a contract, document or policy from Legal with the client, so it shows in their hub
 * with its live status and signatures. Policies must be published and not HR-only.
 */
export function ShareWithClientForm({
  clientId,
  onDone,
  onCancel,
}: Readonly<ShareWithClientFormProps>) {
  const [share] = useShareWithClientMutation();
  const methods = useForm<ShareWithClientFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(shareWithClientSchema),
    defaultValues: shareWithClientDefaults,
  });
  const kind = useWatch({ control: methods.control, name: 'kind' });
  const { data, loading } = useClientShareOptionsQuery({ variables: { kind } });
  const options = (data?.clientShareOptions ?? []).map((option) => ({
    value: option.id,
    label: `${option.title} (${option.status})`,
  }));
  // A record of one kind is not a record of another: changing the kind clears the pick.
  const { resetField } = methods;
  useEffect(() => {
    resetField('refId');
  }, [kind, resetField]);

  const { onSubmit } = useEntitySave({
    label: 'Share',
    initial: null,
    create: (input: ShareWithClientFormValues) => share({ variables: { clientId, input } }),
    update: () => Promise.resolve(),
    onDone,
  });
  const pickHint = loading ? 'Loading…' : 'Latest 200, most recently changed first';

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Share"
      onCancel={onCancel}
    >
      <RhfSelect name="kind" label="What to share" options={KIND_OPTIONS} />
      <RhfAutocomplete
        name="refId"
        label="Record"
        options={options}
        helperText={pickHint}
        required
      />
      <RhfTextField
        name="note"
        label="Note to the client"
        multiline
        minRows={2}
        helperText="Shown beside it in the hub"
      />
      <RhfSwitch name="notify" label="Email the client's hub contacts about it" />
    </EntityForm>
  );
}
