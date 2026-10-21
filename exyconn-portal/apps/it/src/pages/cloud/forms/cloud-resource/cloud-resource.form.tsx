import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import { RhfDatePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItCloudKind,
  ItEnvironment,
  ItServiceStatus,
  useCreateItCloudResourceMutation,
  useUpdateItCloudResourceMutation,
} from '@exyconn/shell/graphql/generated';
import {
  cloudResourceSchema,
  toCloudResourceInput,
  toCloudResourceValues,
  type CloudResourceValues,
} from './cloud-resource.schema';
import type { CloudResourceRow } from './cloud-resource.types';

const KIND_OPTIONS = enumOptions(Object.values(ItCloudKind));
const ENVIRONMENT_OPTIONS = enumOptions(Object.values(ItEnvironment));
const STATUS_OPTIONS = enumOptions(Object.values(ItServiceStatus));

interface CloudResourceFormProps {
  initial: CloudResourceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for a server, cluster, database, domain or certificate. */
export function CloudResourceForm({ initial, onDone, onCancel }: Readonly<CloudResourceFormProps>) {
  const [create] = useCreateItCloudResourceMutation();
  const [update] = useUpdateItCloudResourceMutation();
  const methods = useForm<z.input<typeof cloudResourceSchema>, unknown, CloudResourceValues>({
    mode: 'onTouched',
    resolver: zodResolver(cloudResourceSchema),
    defaultValues: toCloudResourceValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Cloud resource',
    initial,
    create: (values: CloudResourceValues) =>
      create({ variables: { input: toCloudResourceInput(values) } }),
    update: (row, values) =>
      update({ variables: { id: row.id, input: toCloudResourceInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" helperText="e.g. api.exyconn.com, prod-db-1" />
      <RhfSelect
        name="kind"
        label="Kind"
        options={KIND_OPTIONS}
        helperText="What it is. Domains and SSL certificates need an expiry date."
      />
      <RhfTextField name="provider" label="Provider" helperText="e.g. AWS, Hetzner, GoDaddy" />
      <RhfSelect
        name="environment"
        label="Environment"
        options={ENVIRONMENT_OPTIONS}
        helperText="Whether it serves production, staging or development."
      />
      <RhfTextField
        name="region"
        label="Region"
        helperText="Optional. The provider's region or data centre, e.g. eu-west-1."
      />
      <RhfTextField
        name="endpoint"
        label="Endpoint"
        helperText="Hostname or URL — never a credential"
      />
      <RhfDatePicker
        name="expiresAt"
        label="Expires on"
        helperText="When it lapses; IT is warned ahead. Leave empty if it does not expire."
      />
      <RhfTextField
        name="monthlyCost"
        label="Monthly cost"
        type="number"
        helperText="What it costs each month. Enter 0 if it is free."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Whether it is running normally, degraded, down or retired."
      />
      <RhfTextField
        name="ownerName"
        label="Owner"
        helperText="Optional. The person responsible for it."
      />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        rows={3}
        helperText="Optional. Setup details or known issues. Never store credentials here."
      />
    </EntityForm>
  );
}
