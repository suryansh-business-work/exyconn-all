import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfDateTimePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import {
  ActivitySubject,
  ActivityType,
  CrmCalendarDocument,
  CrmTimelineDocument,
  useCreateActivityMutation,
  useListEmployeeOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import {
  addReminderDefaults,
  addReminderSchema,
  type AddReminderValues,
  type ReminderTarget,
} from './add-reminder.types';

interface AddReminderFormProps {
  target: ReminderTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to set a reminder on a contact or company: a task due at the chosen
 * time, emailed to the assignee (you, unless you pick somebody else) when that time comes.
 */
export function AddReminderForm({ target, onDone, onCancel }: Readonly<AddReminderFormProps>) {
  const { user } = useAuth();
  const { data: people, loading: peopleLoading } = useListEmployeeOptionsQuery();
  const [createActivity] = useCreateActivityMutation({
    refetchQueries: [CrmTimelineDocument, CrmCalendarDocument],
  });
  const methods = useForm<AddReminderValues>({
    mode: 'onTouched',
    resolver: zodResolver(addReminderSchema),
    defaultValues: addReminderDefaults(user?.id ?? ''),
  });
  const options = (people?.listEmployeeOptions ?? []).map((person) => ({
    value: person.id,
    label: `${person.name} (${person.email})`,
  }));
  const nameOf = (id: string) =>
    people?.listEmployeeOptions.find((person) => person.id === id)?.name ?? user?.name ?? '';

  const { onSubmit } = useEntitySave({
    label: 'Reminder',
    initial: null,
    create: (values: AddReminderValues) =>
      createActivity({
        variables: {
          input: {
            type: ActivityType.Task,
            subject: values.subject,
            notes: values.notes,
            relatedType:
              target.relatedType === 'CONTACT' ? ActivitySubject.Contact : ActivitySubject.Company,
            relatedId: target.relatedId,
            relatedName: target.relatedName,
            dueDate: values.remindAt,
            remindAt: values.remindAt,
            assigneeId: values.assigneeId,
            done: false,
            owner: nameOf(values.assigneeId),
          },
        },
      }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Add reminder"
      onCancel={onCancel}
    >
      <RhfTextField
        name="subject"
        label="Title"
        helperText="What to be reminded about, e.g. Send the revised quote."
      />
      <RhfDateTimePicker
        name="remindAt"
        label="Remind at"
        helperText="The assignee is emailed at this time"
      />
      <RhfSelect
        name="assigneeId"
        label="Assignee"
        options={options}
        helperText={peopleLoading ? 'Loading people…' : undefined}
      />
      <RhfTextField
        name="notes"
        label="Note (optional)"
        multiline
        minRows={3}
        helperText="Extra detail for whoever is reminded, up to 10,000 characters."
      />
    </EntityForm>
  );
}
