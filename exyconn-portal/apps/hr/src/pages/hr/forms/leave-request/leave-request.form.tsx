import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import {
  RhfSelect,
  RhfDatePicker,
  RhfTextField,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
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
  const notify = useNotify();
  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [updateLeaveRequest] = useUpdateLeaveRequestMutation();
  const { data } = useListUsersQuery();
  const isEdit = Boolean(initial);

  const employeeOptions = (data?.listUsers ?? []).map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) {
        await updateLeaveRequest({ variables: { id: initial.id, input: values } });
      } else {
        await createLeaveRequest({ variables: { input: values } });
      }
      notify(`Leave request ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
          <RhfSelect name="type" label="Type" options={enumOptions(Object.values(LeaveType))} />
          <RhfDatePicker name="fromDate" label="From date" />
          <RhfDatePicker name="toDate" label="To date" />
          <RhfTextField name="reason" label="Reason" multiline minRows={2} />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(LeaveStatus))}
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
