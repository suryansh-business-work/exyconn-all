import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ItNetworkKind,
  ItServiceStatus,
  useCreateItNetworkItemMutation,
  useUpdateItNetworkItemMutation,
} from '@exyconn/shell/graphql/generated';
import {
  networkItemSchema,
  toNetworkItemValues,
  type NetworkItemValues,
} from './network-item.schema';
import type { NetworkItemRow } from './network-item.types';

const KIND_OPTIONS = enumOptions(Object.values(ItNetworkKind));
const STATUS_OPTIONS = enumOptions(Object.values(ItServiceStatus));

interface NetworkItemFormProps {
  initial: NetworkItemRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for one Wi-Fi network, VPN, firewall, DNS zone or IP range. */
export function NetworkItemForm({ initial, onDone, onCancel }: Readonly<NetworkItemFormProps>) {
  const [create] = useCreateItNetworkItemMutation();
  const [update] = useUpdateItNetworkItemMutation();
  const methods = useForm<NetworkItemValues>({
    resolver: zodResolver(networkItemSchema),
    defaultValues: toNetworkItemValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Network item',
    initial,
    create: (values: NetworkItemValues) => create({ variables: { input: values } }),
    update: (row, values) => update({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" helperText="e.g. Office Wi-Fi, Staff VPN" />
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} />
      <RhfTextField
        name="address"
        label="Address"
        helperText="IP, CIDR range, hostname or SSID — never a password"
      />
      <RhfTextField name="location" label="Location" />
      <RhfTextField name="provider" label="Provider" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="notes" label="Notes" multiline rows={3} />
    </EntityForm>
  );
}
