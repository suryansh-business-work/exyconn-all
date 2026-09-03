import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  useCreateStatusMonitorMutation,
  useUpdateStatusMonitorMutation,
} from '@exyconn/shell/graphql/generated';
import { STATUS_CATEGORIES } from '../../status-monitors.constants';
import { statusMonitorSchema, toStatusMonitorValues } from './status-monitor.schema';
import type { StatusMonitorRow } from './status-monitor.types';

const CATEGORY_OPTIONS = enumOptions(STATUS_CATEGORIES);
type Values = z.infer<typeof statusMonitorSchema>;

interface StatusMonitorFormProps {
  initial: StatusMonitorRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Add or edit one endpoint the status page watches. */
export function StatusMonitorForm({ initial, onDone, onCancel }: Readonly<StatusMonitorFormProps>) {
  const [createMonitor] = useCreateStatusMonitorMutation();
  const [updateMonitor] = useUpdateStatusMonitorMutation();
  const methods = useForm<z.input<typeof statusMonitorSchema>, unknown, Values>({
    resolver: zodResolver(statusMonitorSchema),
    defaultValues: toStatusMonitorValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Status monitor',
    initial,
    create: (values: Values) => createMonitor({ variables: { input: values } }),
    update: (row: StatusMonitorRow, values: Values) =>
      updateMonitor({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Service name" helperText="Shown on the public page" />
      <RhfTextField name="key" label="Key" helperText="Stable identifier, e.g. hr or tools-api" />
      <RhfTextField name="description" label="Description" />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfTextField name="url" label="URL to probe" helperText="A 2xx response counts as healthy" />
      <RhfTextField name="order" label="Order" type="number" />
      <RhfSwitch name="isActive" label="Show on the status page" />
    </EntityForm>
  );
}
