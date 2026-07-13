import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { AttendanceStatus, useMarkAttendanceMutation } from '@/graphql/generated';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  status: z.nativeEnum(AttendanceStatus),
  note: z.string().trim().max(200, 'Keep the note under 200 characters'),
});
type Values = z.infer<typeof schema>;

/** React Hook Form + Zod form for an employee to mark attendance for a day (upserts). */
export function MarkAttendanceForm({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: () => void;
}) {
  const notify = useNotify();
  const [markAttendance] = useMarkAttendanceMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString(), status: AttendanceStatus.Present, note: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await markAttendance({
        variables: { input: { date: values.date, status: values.status, note: values.note } },
      });
      notify('Attendance saved');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save attendance', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfDatePicker name="date" label="Date" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(AttendanceStatus))}
          />
          <RhfTextField name="note" label="Note (optional)" multiline minRows={2} />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Save"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
