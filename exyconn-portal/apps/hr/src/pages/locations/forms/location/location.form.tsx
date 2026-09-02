import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from '@exyconn/shell/graphql/generated';
import type { LocationRow } from './location.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  city: z.string().trim(),
  state: z.string().trim(),
  country: z.string().trim(),
  timezone: z.string().trim().min(1, 'Timezone is required'),
  address: z.string().trim(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LocationRow | null) => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  city: row?.city ?? '',
  state: row?.state ?? '',
  country: row?.country ?? '',
  timezone: row?.timezone ?? '',
  address: row?.address ?? '',
  active: row?.active ?? false,
});

const toInput = (values: Values) => values;

interface LocationFormProps {
  initial: LocationRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a location. */
export function LocationForm({ initial, onDone, onCancel }: Readonly<LocationFormProps>) {
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Location',
    initial,
    create: (values: Values) => createLocation({ variables: { input: toInput(values) } }),
    update: (row, values) => updateLocation({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="code" label="Code" />
      <RhfTextField name="city" label="City" />
      <RhfTextField name="state" label="State" />
      <RhfTextField name="country" label="Country" />
      <RhfTextField name="timezone" label="Timezone" />
      <RhfTextField name="address" label="Address" multiline minRows={3} />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}
