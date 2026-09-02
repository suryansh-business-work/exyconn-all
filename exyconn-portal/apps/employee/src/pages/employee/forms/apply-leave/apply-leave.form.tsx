import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { LeaveType, useApplyLeaveMutation } from '@exyconn/shell/graphql/generated';

const schema = z
  .object({
    type: z.nativeEnum(LeaveType),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    reason: z.string().trim().min(1, 'Reason is required').min(3, 'Add a brief reason'),
  })
  .refine((d) => !d.fromDate || !d.toDate || new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To date must be on or after the from date',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = { type: LeaveType.Casual, fromDate: '', toDate: '', reason: '' };

/** React Hook Form + Zod form for an employee to apply for leave (status set to PENDING). */
export function ApplyLeaveForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const notify = useNotify();
  const [applyLeave] = useApplyLeaveMutation();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const onSubmit = async (values: Values) => {
    try {
      await applyLeave({ variables: { input: values } });
      notify('Leave applied — pending approval');
      methods.reset();
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not apply for leave', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Apply"
    >
      <RhfSelect name="type" label="Leave type" options={enumOptions(Object.values(LeaveType))} />
      <RhfDatePicker name="fromDate" label="From date" />
      <RhfDatePicker name="toDate" label="To date" />
      <RhfTextField name="reason" label="Reason" multiline minRows={2} />
    </EntityForm>
  );
}
