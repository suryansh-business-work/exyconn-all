import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useMaUpdateSettingsMutation } from '@exyconn/shell/graphql/generated';
import { useEmployeeOptions } from '../../lib/useEmployeeOptions';
import { useRunNotified } from '../../lib/useRunNotified';
import {
  meetingSettingsSchema,
  toSettingsValues,
  type MeetingSettingsFormInput,
  type MeetingSettingsValues,
} from './meeting-settings.schema';
import {
  AccessSection,
  EmailSection,
  LimitsSection,
  NotesSection,
} from './meeting-settings.sections';
import type { MeetingSettingsRow } from './meeting-settings.types';

/** The company's Meeting Assistant settings: access, reminders, notes, email, limits, releases. */
export function MeetingSettingsForm({ settings }: Readonly<{ settings: MeetingSettingsRow }>) {
  const [updateSettings] = useMaUpdateSettingsMutation();
  const runNotified = useRunNotified();
  const methods = useForm<MeetingSettingsFormInput, unknown, MeetingSettingsValues>({
    mode: 'onTouched',
    resolver: zodResolver(meetingSettingsSchema),
    defaultValues: toSettingsValues(settings),
  });
  const people = useEmployeeOptions();

  const onSubmit = async (values: MeetingSettingsValues) => {
    const saved = await runNotified(
      () => updateSettings({ variables: { input: values } }),
      'Meeting Assistant settings saved',
    );
    if (saved) {
      methods.reset(values);
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={() => methods.reset()}
      submitLabel="Save settings"
    >
      <AccessSection people={people} />
      <NotesSection />
      <EmailSection />
      <LimitsSection />
    </EntityForm>
  );
}
