import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useUpdatePayrollScheduleMutation } from '@exyconn/shell/graphql/generated';
import type { PayslipScheduleRow } from './payslip-schedule.types';

/** The 29th–31st are missing from some months, so the schedule stops at the 28th. */
const MAX_DAY = 28;

const schema = z.object({
  enabled: z.boolean(),
  dayOfMonth: z.coerce
    .number()
    .int('Pick a whole day of the month')
    .min(1, 'The earliest is the 1st')
    .max(MAX_DAY, `The latest is the ${MAX_DAY}th, so every month has it`),
  hour: z.coerce.number().int().min(0, 'Pick an hour').max(23, 'Pick an hour'),
  minute: z.coerce.number().int().min(0, 'Pick a minute').max(59, 'Pick a minute'),
  period: z.enum(['PREVIOUS_MONTH', 'CURRENT_MONTH'], {
    message: 'Choose which month is sent',
  }),
});
type Values = z.infer<typeof schema>;

const range = (count: number, from: number, label: (value: number) => string): SelectOption[] =>
  Array.from({ length: count }, (_unused, index) => ({
    value: String(from + index),
    label: label(from + index),
  }));

const DAY_OPTIONS = range(MAX_DAY, 1, (day) => `Day ${day}`);
const HOUR_OPTIONS = range(24, 0, (hour) => `${String(hour).padStart(2, '0')}:00`);
const MINUTE_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_unused, index) => {
  const minute = index * 5;
  return { value: String(minute), label: `:${String(minute).padStart(2, '0')}` };
});
const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'PREVIOUS_MONTH', label: 'The previous month' },
  { value: 'CURRENT_MONTH', label: 'The current month' },
];

interface PayslipScheduleFormProps {
  initial: PayslipScheduleRow;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * When payslip emails go out. The time is read in the portal timezone set under
 * Admin > Settings, so what HR types here is the clock they are looking at.
 */
export function PayslipScheduleForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PayslipScheduleFormProps>) {
  const notify = useNotify();
  const [saveSchedule] = useUpdatePayrollScheduleMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    values: {
      enabled: initial.enabled,
      dayOfMonth: initial.dayOfMonth,
      hour: initial.hour,
      minute: initial.minute,
      period: initial.period as Values['period'],
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      await saveSchedule({ variables: { input: values } });
      notify(values.enabled ? 'Payslip emails are scheduled' : 'Scheduled payslip emails are off');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the schedule', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save schedule"
    >
      <Text size="sm" color="text.secondary">
        Every employee with a payslip for the chosen month is emailed their own PDF. A month
        already sent is never sent again, so a restart cannot email anybody twice.
      </Text>
      <RhfSwitch name="enabled" label="Email payslips automatically" />
      <RhfSelect name="dayOfMonth" label="Day of the month" options={DAY_OPTIONS} />
      <RhfSelect name="hour" label="Hour" options={HOUR_OPTIONS} />
      <RhfSelect name="minute" label="Minute" options={MINUTE_OPTIONS} />
      <RhfSelect name="period" label="Send payslips for" options={PERIOD_OPTIONS} />
    </EntityForm>
  );
}
