import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfDateTimePicker,
  RhfMultiSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateStatusMaintenanceMutation,
  useListStatusMonitorsQuery,
  useUpdateStatusMaintenanceMutation,
} from '@exyconn/shell/graphql/generated';
import type {
  MaintenanceFormProps,
  MaintenanceFormValues,
  MaintenanceRow,
} from './maintenance.types';

export const maintenanceSchema = z
  .object({
    title: z.string().trim().min(5, 'Give the window a title').max(120, 'Keep the title short'),
    body: z.string().trim().max(4000, 'Keep the notice under 4000 characters'),
    affectedServiceKeys: z.array(z.string()).min(1, 'Choose at least one affected service'),
    startsAt: z.string().min(1, 'When does it start?'),
    endsAt: z.string().min(1, 'When does it end?'),
  })
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    path: ['endsAt'],
    message: 'The window must end after it starts',
  });

type Values = z.infer<typeof maintenanceSchema>;

export function toMaintenanceValues(row: MaintenanceRow | null): MaintenanceFormValues {
  return {
    title: row?.title ?? '',
    body: row?.body ?? '',
    affectedServiceKeys: row?.affectedServiceKeys ?? [],
    startsAt: row?.startsAt ?? '',
    endsAt: row?.endsAt ?? '',
  };
}

/** Plan or reschedule a maintenance window. */
export function MaintenanceForm({ initial, onDone, onCancel }: Readonly<MaintenanceFormProps>) {
  const [createWindow] = useCreateStatusMaintenanceMutation();
  const [updateWindow] = useUpdateStatusMaintenanceMutation();
  const { data } = useListStatusMonitorsQuery();
  const methods = useForm<z.input<typeof maintenanceSchema>, unknown, Values>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: toMaintenanceValues(initial),
  });

  const services = (data?.listStatusMonitors ?? []).map((monitor) => ({
    value: monitor.key,
    label: monitor.name,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Maintenance window',
    initial,
    create: (values: Values) => createWindow({ variables: { input: values } }),
    update: (row: MaintenanceRow, values: Values) =>
      updateWindow({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" helperText="Shown on the status page banner" />
      <RhfMultiSelect name="affectedServiceKeys" label="Affected services" options={services} />
      <RhfDateTimePicker name="startsAt" label="Starts" />
      <RhfDateTimePicker name="endsAt" label="Ends" />
      <RhfTextField
        name="body"
        label="Notice"
        multiline
        rows={4}
        helperText="What is being done and what people should expect"
      />
    </EntityForm>
  );
}
