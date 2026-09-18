import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { leaveTypeOptions } from '@exyconn/shell/utils/leaveTypeOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useActiveLeavePoliciesQuery,
  useApplyLeaveMutation,
} from '@exyconn/shell/graphql/generated';

const schema = z
  .object({
    type: z.string().min(1, 'Choose a leave type'),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    reason: z.string().trim().min(1, 'Reason is required').min(3, 'Add a brief reason'),
  })
  .refine((d) => !d.fromDate || !d.toDate || new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To date must be on or after the from date',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = { type: '', fromDate: '', toDate: '', reason: '' };

/** React Hook Form + Zod form for an employee to apply for leave (status set to PENDING). */
export function ApplyLeaveForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const notify = useNotify();
  const [applyLeave] = useApplyLeaveMutation();
  // Only the leave types HR offers in this employee's country, on that country's terms.
  const { data: policies, loading } = useActiveLeavePoliciesQuery();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const offered = useMemo(() => leaveTypeOptions(policies?.activeLeavePolicies ?? []), [policies]);
  const noneOffered = !loading && offered.length === 0;

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
      <RhfSelect
        name="type"
        label="Leave type"
        options={offered}
        helperText={
          noneOffered ? 'HR has not set up any leave types for your country yet.' : undefined
        }
      />
      <RhfDatePicker name="fromDate" label="From date" />
      <RhfDatePicker name="toDate" label="To date" />
      <RhfTextField name="reason" label="Reason" multiline minRows={2} />
    </EntityForm>
  );
}
