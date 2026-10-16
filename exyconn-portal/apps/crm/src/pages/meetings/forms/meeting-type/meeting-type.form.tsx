import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timezoneOptions } from '@exyconn/i18n';
import { Divider } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateMeetingTypeMutation,
  useUpdateMeetingTypeMutation,
} from '@exyconn/shell/graphql/generated';
import {
  meetingTypeSchema,
  slugFrom,
  toMeetingTypeValues,
  type MeetingTypeRow,
  type MeetingTypeValues,
} from './meeting-type.types';
import { WeeklyHoursFields } from './weekly-hours.fields';

interface MeetingTypeFormProps {
  initial: MeetingTypeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * React Hook Form + Zod form for a bookable meeting: its name and link, length, where it
 * happens, the host's weekly availability and the booking rules.
 */
export function MeetingTypeForm({ initial, onDone, onCancel }: Readonly<MeetingTypeFormProps>) {
  const [createType] = useCreateMeetingTypeMutation();
  const [updateType] = useUpdateMeetingTypeMutation();
  const methods = useForm({
    mode: 'onTouched',
    resolver: zodResolver(meetingTypeSchema),
    defaultValues: toMeetingTypeValues(initial, browserZone()),
  });
  const zone = useWatch({ control: methods.control, name: 'timezone' });
  const zones = useMemo(() => timezoneOptions(zone), [zone]);
  const title = useWatch({ control: methods.control, name: 'title' });

  // A new type's link follows its name until somebody edits the link.
  useEffect(() => {
    if (!initial && !methods.getFieldState('slug').isDirty) {
      methods.setValue('slug', slugFrom(title));
    }
  }, [initial, title, methods]);

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Meeting type',
    initial,
    create: (values: MeetingTypeValues) => createType({ variables: { input: values } }),
    update: (row, values) => updateType({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Meeting name" helperText="e.g. 30-minute intro call" />
      <RhfTextField
        name="slug"
        label="Link"
        helperText="The end of the booking link: /book/<link>"
      />
      <RhfTextField name="description" label="Description" multiline minRows={2} />
      <RhfTextField name="durationMinutes" label="Length (minutes)" inputMode="numeric" />
      <RhfTextField
        name="location"
        label="Location"
        helperText="A video-call link, a phone number or an address; shown once booked"
      />
      <RhfAutocomplete name="timezone" label="Time zone" options={zones} />
      <Divider />
      <WeeklyHoursFields />
      <Divider />
      <RhfTextField
        name="bufferMinutes"
        label="Buffer between meetings (minutes)"
        inputMode="numeric"
      />
      <RhfTextField name="minNoticeHours" label="Minimum notice (hours)" inputMode="numeric" />
      <RhfTextField name="maxDaysAhead" label="Bookable up to (days ahead)" inputMode="numeric" />
      <RhfSwitch name="active" label="The booking link is open" />
    </EntityForm>
  );
}
