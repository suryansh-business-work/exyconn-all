import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { RhfAutocomplete, RhfDatePicker, RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useDelegateApprovalsMutation, useListEmployeeOptionsQuery } from '@/graphql/generated';
import type { DelegateApprovalsFormProps } from './delegate.types';

const schema = z
  .object({
    toEmployeeId: z.string().min(1, 'Choose who will cover you'),
    fromDate: z.string().min(1, 'Say when it starts'),
    toDate: z.string().min(1, 'Say when it ends'),
    note: z.string().trim().max(200, 'Keep the note under 200 characters'),
  })
  // The server refuses this too; catching it here answers before the round trip.
  .refine((values) => values.toDate >= values.fromDate, {
    path: ['toDate'],
    message: 'The last day cannot be before the first',
  });

type Values = z.infer<typeof schema>;

/**
 * Hands your approvals to a colleague for a window.
 *
 * A window rather than a switch, because somebody setting this on the way out of the door
 * should not have to remember to turn it off when they come back.
 */
export function DelegateApprovalsForm({ onDone, onCancel }: Readonly<DelegateApprovalsFormProps>) {
  const t = useT();
  const notify = useNotify();
  const { data } = useListEmployeeOptionsQuery();
  const [delegate] = useDelegateApprovalsMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { toEmployeeId: '', fromDate: '', toDate: '', note: '' },
  });

  const people = (data?.listEmployeeOptions ?? []).map((person) => ({
    value: person.id,
    label: `${person.name} (${person.email})`,
  }));

  const onSubmit = async (values: Values) => {
    try {
      await delegate({
        variables: {
          input: {
            toEmployeeId: values.toEmployeeId,
            fromDate: values.fromDate,
            toDate: values.toDate,
            note: values.note || null,
          },
        },
      });
      notify(t('Your approvals are covered for that window.'), 'success');
      onDone();
    } catch (err) {
      notify(errorMessage(err, t('That could not be arranged.')), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Arrange cover"
    >
      <RhfAutocomplete
        name="toEmployeeId"
        label="Who covers you"
        options={people}
        helperText="They see exactly what you would have seen, and nothing more"
      />
      <RhfDatePicker name="fromDate" label="First day" />
      <RhfDatePicker name="toDate" label="Last day (included)" />
      <RhfTextField name="note" label="Note (optional)" />
    </EntityForm>
  );
}
