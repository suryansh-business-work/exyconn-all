import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfWorkDays } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSetDefaultWorkDaysMutation } from '@exyconn/shell/graphql/generated';
import type { WorkWeekFormValues, WorkWeekRow } from './work-week.types';

const schema = z.object({
  days: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Pick at least one working day')
    .max(7, 'A week has seven days'),
}) satisfies z.ZodType<WorkWeekFormValues>;

type Values = z.infer<typeof schema>;

interface WorkWeekFormProps {
  initial: WorkWeekRow;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The company's working week. Everyone without a week of their own works these days; the rest
 * are their week off in the trackers, the calendars and the expected hours.
 */
export function WorkWeekForm({ initial, onDone, onCancel }: Readonly<WorkWeekFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [save] = useSetDefaultWorkDaysMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    values: { days: [...initial.defaultWorkDays] },
  });

  const onSubmit = async ({ days }: Values) => {
    try {
      await save({ variables: { days } });
      notify('Work week saved');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the work week', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save work week"
    >
      <Text size="sm" color="text.secondary">
        {t(
          'The days people work unless their employee record sets a week of their own. The other days are their week off: no expected hours, and the tracker does not run.',
        )}
      </Text>
      <RhfWorkDays name="days" label="Work days" />
    </EntityForm>
  );
}
