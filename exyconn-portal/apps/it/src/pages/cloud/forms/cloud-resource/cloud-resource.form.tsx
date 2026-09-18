import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} />
      <RhfTextField name="provider" label="Provider" helperText="e.g. AWS, Hetzner, GoDaddy" />
      <RhfSelect name="environment" label="Environment" options={ENVIRONMENT_OPTIONS} />
      <RhfTextField name="region" label="Region" />
      <RhfTextField
        name="endpoint"
        label="Endpoint"
        helperText="Hostname or URL — never a credential"
      />
      <RhfDatePicker name="expiresAt" label="Expires on" />
      <RhfTextField name="monthlyCost" label="Monthly cost" type="number" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="ownerName" label="Owner" />
      <RhfTextField name="notes" label="Notes" multiline rows={3} />
    </EntityForm>
  );
}
