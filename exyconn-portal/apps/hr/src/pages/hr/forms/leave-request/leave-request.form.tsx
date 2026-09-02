import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfSelect,
  RhfDatePicker,
  RhfTextField,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  LeaveType,
  LeaveStatus,
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
  useListUsersQuery,
} from '@exyconn/shell/graphql/generated';
import type { LeaveRequestRow } from './leave-request.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  type: z.nativeEnum(LeaveType),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  reason: z.string().trim().min(3, 'Add a reason'),
  status: z.nativeEnum(LeaveStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LeaveRequestRow | null): Values => ({
  employeeId: row?.employeeId ?? '',
  type: row?.type ?? LeaveType.Casual,
  fromDate: row?.fromDate ?? '',
  toDate: row?.toDate ?? '',
  reason: row?.reason ?? '',
  status: row?.status ?? LeaveStatus.Pending,
});

interface LeaveRequestFormProps {
  initial: LeaveRequestRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create/update a leave request (searchable employee). */
export function LeaveRequestForm({ initial, onDone, onCancel }: LeaveRequestFormProps) {
  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [updateLeaveRequest] = useUpdateLeaveRequestMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Leave request',
    initial,
    create: (values: Values) => createLeaveRequest({ variables: { input: values } }),
    update: (row, values) => updateLeaveRequest({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfSelect name="type" label="Type" options={enumOptions(Object.values(LeaveType))} />
      <RhfDatePicker name="fromDate" label="From date" />
      <RhfDatePicker name="toDate" label="To date" />
      <RhfTextField name="reason" label="Reason" multiline minRows={2} />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(LeaveStatus))} />
    </EntityForm>
  );
}
