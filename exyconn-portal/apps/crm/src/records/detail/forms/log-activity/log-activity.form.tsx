import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfDatePicker,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ActivitySubject,
  ActivityType,
  CrmTimelineDocument,
  useCreateActivityMutation,
} from '@exyconn/shell/graphql/generated';
import { MediaAttachField } from '../../media/MediaAttachField';
import {
  LOGGABLE_TYPES,
  logActivityDefaults,
  logActivitySchema,
  type LogActivityTarget,
  type LogActivityValues,
} from './log-activity.types';

const TYPE_OPTIONS = enumOptions([...LOGGABLE_TYPES]);
const TIMED: ReadonlySet<string> = new Set([ActivityType.Call, ActivityType.Meeting]);

interface LogActivityFormProps {
  target: LogActivityTarget;
  type: LogActivityValues['type'];
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to log a note, call, meeting or task on a contact or company, with
 * photos, documents and audio or video recordings. It lands on the timeline at once.
 */
export function LogActivityForm({
  target,
  type,
  onDone,
  onCancel,
}: Readonly<LogActivityFormProps>) {
  const { user } = useAuth();
  const [createActivity] = useCreateActivityMutation({ refetchQueries: [CrmTimelineDocument] });
  const methods = useForm<LogActivityValues>({
    mode: 'onTouched',
    resolver: zodResolver(logActivitySchema),
    defaultValues: logActivityDefaults(type),
  });
  const chosen = useWatch({ control: methods.control, name: 'type' });

  const { onSubmit } = useEntitySave({
    label: 'Activity',
    initial: null,
    create: (values: LogActivityValues) =>
      createActivity({
        variables: {
          input: {
            type: values.type,
            subject: values.subject,
            notes: values.notes,
            relatedType:
              target.relatedType === 'CONTACT' ? ActivitySubject.Contact : ActivitySubject.Company,
            relatedId: target.relatedId,
            relatedName: target.relatedName,
            dueDate: values.dueDate === '' ? null : values.dueDate,
            done: values.done,
            owner: user?.name ?? '',
            durationSeconds:
              values.durationMinutes === '' ? null : Number(values.durationMinutes) * 60,
            attachments: values.attachments,
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
      submitLabel="Log"
      onCancel={onCancel}
    >
      <RhfSelect
        name="type"
        label="Type"
        options={TYPE_OPTIONS}
        helperText="Note, call, meeting or task; emails are logged from the connected mailbox instead."
      />
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="A short summary shown on the timeline, e.g. Pricing call with Priya."
      />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        minRows={3}
        helperText="Optional. What was said or agreed, up to 10,000 characters."
      />
      {TIMED.has(chosen) && (
        <RhfTextField
          name="durationMinutes"
          label="Duration (minutes)"
          inputMode="numeric"
          helperText="Optional. Whole minutes, up to 1440."
        />
      )}
      {chosen === ActivityType.Task && (
        <RhfDatePicker name="dueDate" label="Due" helperText="When the task should be done." />
      )}
      <RhfSwitch name="done" label="Done" />
      <MediaAttachField name="attachments" />
    </EntityForm>
  );
}
