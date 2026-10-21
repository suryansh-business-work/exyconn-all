import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useMaConfirmSpeakerMutation } from '@exyconn/shell/graphql/generated';
import { useEmployeeOptions } from '../../lib/useEmployeeOptions';
import { useRunNotified } from '../../lib/useRunNotified';
import type { ConfirmSpeakerInput, ConfirmSpeakerValues } from './confirm-speaker.types';

const MAX_NAME = 120;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(MAX_NAME, 'Keep the name under 120 characters'),
  userId: z.string(),
});

/** The values as the server takes them: no user is null, not ''. */
export const toSpeakerInput = (
  label: string,
  values: ConfirmSpeakerValues,
): ConfirmSpeakerInput => ({
  label,
  name: values.name,
  userId: values.userId || null,
});

interface ConfirmSpeakerFormProps {
  meetingId: string;
  /** The diarization label being named, e.g. "Unknown Speaker 1". */
  label: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Says who a diarization label is. The label stays on every line as the evidence; the name is
 * shown beside it from now on, and a matching portal user links the speaker to their record.
 */
export function ConfirmSpeakerForm({
  meetingId,
  label,
  onDone,
  onCancel,
}: Readonly<ConfirmSpeakerFormProps>) {
  const t = useT();
  const [confirmSpeaker] = useMaConfirmSpeakerMutation();
  const runNotified = useRunNotified();
  const methods = useForm<ConfirmSpeakerValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { name: '', userId: '' },
  });
  const people = useEmployeeOptions();

  const onSubmit = async (values: ConfirmSpeakerValues) => {
    const saved = await runNotified(
      () => confirmSpeaker({ variables: { meetingId, input: toSpeakerInput(label, values) } }),
      'Speaker confirmed',
    );
    if (saved) {
      onDone();
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Confirm speaker"
    >
      <Text size="sm" color="text.secondary">
        {t('Every line labelled {label} will show this name.', { label })}
      </Text>
      <RhfTextField name="name" label="Speaker name" />
      <RhfAutocomplete
        name="userId"
        label="Portal user (optional)"
        options={people}
        helperText="Link the speaker to a colleague when they have a portal account"
      />
    </EntityForm>
  );
}
