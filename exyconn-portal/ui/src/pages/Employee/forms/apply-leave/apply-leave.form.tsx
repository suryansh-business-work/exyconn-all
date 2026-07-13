import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { LeaveType, useApplyLeaveMutation } from '@/graphql/generated';

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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfSelect
            name="type"
            label="Leave type"
            options={enumOptions(Object.values(LeaveType))}
          />
          <RhfDatePicker name="fromDate" label="From date" />
          <RhfDatePicker name="toDate" label="To date" />
          <RhfTextField name="reason" label="Reason" multiline minRows={2} />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Apply"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
