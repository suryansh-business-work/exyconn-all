import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  RequestStatus,
  RequestType,
  useListUsersQuery,
  useCreateEmployeeRequestMutation,
  useUpdateEmployeeRequestMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmployeeRequestRow } from './employee-request.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  type: z.nativeEnum(RequestType),
  subject: z.string().trim().min(1, 'Subject is required'),
  details: z.string().trim().min(1, 'Details is required'),
  status: z.nativeEnum(RequestStatus),
  decisionNote: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmployeeRequestRow | null) => ({
  employeeId: row?.employeeId ?? '',
  type: row?.type ?? Object.values(RequestType)[0],
  subject: row?.subject ?? '',
  details: row?.details ?? '',
  status: row?.status ?? Object.values(RequestStatus)[0],
  decisionNote: row?.decisionNote ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  decisionNote: values.decisionNote === '' ? null : values.decisionNote,
});

interface EmployeeRequestFormProps {
  initial: EmployeeRequestRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an request. */
export function EmployeeRequestForm({
  initial,
  onDone,
  onCancel,
}: Readonly<EmployeeRequestFormProps>) {
  const [createEmployeeRequest] = useCreateEmployeeRequestMutation();
  const [updateEmployeeRequest] = useUpdateEmployeeRequestMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'EmployeeRequest',
    initial,
    create: (values: Values) => createEmployeeRequest({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateEmployeeRequest({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfSelect name="type" label="Type" options={enumOptions(Object.values(RequestType))} />
      <RhfTextField name="subject" label="Subject" />
      <RhfTextField name="details" label="Details" multiline minRows={3} />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(RequestStatus))} />
      <RhfTextField name="decisionNote" label="Decision note" />
    </EntityForm>
  );
}
