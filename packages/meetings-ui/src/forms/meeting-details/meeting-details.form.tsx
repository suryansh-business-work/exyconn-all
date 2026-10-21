import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { MaLanguage, useMaUpdateMeetingMutation } from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';
import type { MeetingDetailsRow, MeetingDetailsValues } from './meeting-details.types';

/** The longest title the meeting list shows without truncating it to nonsense. */
const MAX_TITLE = 300;

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Meeting title is required')
    .max(MAX_TITLE, 'Keep the title under 300 characters'),
  language: z.enum(MaLanguage),
});

interface MeetingDetailsFormProps {
  meeting: MeetingDetailsRow;
}

/** Renames a meeting and corrects its spoken language (which the next analysis uses). */
export function MeetingDetailsForm({ meeting }: Readonly<MeetingDetailsFormProps>) {
  const t = useT();
  const [updateMeeting] = useMaUpdateMeetingMutation();
  const runNotified = useRunNotified();
  const methods = useForm<MeetingDetailsValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { title: meeting.title, language: meeting.language },
  });
  const languages = enumOptions(Object.values(MaLanguage)).map((option) => ({
    ...option,
    label: t(option.label),
  }));

  const onSubmit = async (values: MeetingDetailsValues) => {
    const saved = await runNotified(
      () => updateMeeting({ variables: { id: meeting.id, input: values } }),
      'Meeting updated',
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
      submitLabel="Save"
    >
      <RhfTextField name="title" label="Meeting title" />
      <RhfSelect
        name="language"
        label="Spoken language"
        options={languages}
        helperText="Auto lets the AI detect it; pick one when detection got it wrong"
      />
    </EntityForm>
  );
}
