import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfDatePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  HolidayType,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
} from '@exyconn/shell/graphql/generated';
import type { HolidayRow } from './holiday.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.nativeEnum(HolidayType),
  description: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: HolidayRow | null) => ({
  name: row?.name ?? '',
  date: row?.date ?? '',
  type: row?.type ?? Object.values(HolidayType)[0],
  description: row?.description ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  description: values.description === '' ? null : values.description,
});

interface HolidayFormProps {
  initial: HolidayRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a holiday. */
export function HolidayForm({ initial, onDone, onCancel }: Readonly<HolidayFormProps>) {
  const [createHoliday] = useCreateHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Holiday',
    initial,
    create: (values: Values) => createHoliday({ variables: { input: toInput(values) } }),
    update: (row, values) => updateHoliday({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfDatePicker name="date" label="Date" />
      <RhfSelect name="type" label="Type" options={enumOptions(Object.values(HolidayType))} />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
    </EntityForm>
  );
}
