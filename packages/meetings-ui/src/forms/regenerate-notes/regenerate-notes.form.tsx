import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { MaSummaryStyle, useMaRegenerateNotesMutation } from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';
import type { RegenerateNotesValues } from './regenerate-notes.types';

const schema = z.object({ style: z.enum(MaSummaryStyle, 'Pick a style') });

interface RegenerateNotesFormProps {
  meetingId: string;
  /** The style the current notes were written in. */
  style: MaSummaryStyle;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Queues a fresh analysis of the transcript in the chosen style. Existing action items keep
 * their ids, statuses and every edit; the notes get a new version.
 */
export function RegenerateNotesForm({
  meetingId,
  style,
  onDone,
  onCancel,
}: Readonly<RegenerateNotesFormProps>) {
  const t = useT();
  const [regenerate] = useMaRegenerateNotesMutation();
  const runNotified = useRunNotified();
  const methods = useForm<RegenerateNotesValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { style },
  });
  const styles = enumOptions(Object.values(MaSummaryStyle)).map((option) => ({
    ...option,
    label: t(option.label),
  }));

  const onSubmit = async (values: RegenerateNotesValues) => {
    const queued = await runNotified(
      () => regenerate({ variables: { meetingId, style: values.style } }),
      'New notes are being written',
    );
    if (queued) {
      onDone();
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Regenerate"
    >
      <Text size="sm" color="text.secondary">
        {t('Action items keep their status and edits; the notes get a new version.')}
      </Text>
      <RhfSelect
        name="style"
        label="Summary style"
        options={styles}
        helperText="Who the new notes are written for, e.g. executive, client or sales."
      />
    </EntityForm>
  );
}
