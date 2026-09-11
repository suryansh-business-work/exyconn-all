import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { YStack } from 'tamagui';
import { PRESENCE_OPTIONS, type PresenceState } from '@exyconn/tracker-core';
import { SelectField } from '../../components/form/SelectField';
import { TextField } from '../../components/form/TextField';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import { Caption } from '../../components/ui/Typography';
import { presenceCaption } from '../../lib/dashboard/presence-text';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { PRESENCE_NOTE_MAX, presenceSchema } from './presence.schema';
import type { PresenceValues } from './presence.types';

const FAILED = 'Could not update your status.';

const STATUS_OPTIONS = PRESENCE_OPTIONS.map((option) => ({
  value: option.status,
  label: option.label,
  caption: option.caption,
}));

interface Props {
  presence: PresenceState;
  /** The zone the "since" time is read in — the employee's own, like everything else here. */
  timezone: string;
}

/**
 * What the employee is doing right now, in their own words.
 *
 * Choosing anything but Working pauses the session and coming back resumes it, so a status is
 * applied the moment it is picked — each option's caption says what it does before the tap.
 * The note is a courtesy to whoever is looking for them ("back at 2"): the desktop applies it
 * when the field loses focus; a phone has no reliable blur, so it is applied from the
 * keyboard's return key or the Save note button that appears once it has changed.
 */
export function PresenceForm({ presence, timezone }: Readonly<Props>) {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<PresenceValues>({
    resolver: zodResolver(presenceSchema),
    defaultValues: { status: presence.status, note: presence.note },
  });
  const note = useWatch({ control, name: 'note' });
  const busy = formState.isSubmitting;
  const noteChanged = note.trim() !== presence.note;

  // The portal is the source of truth: a status set from another device, or rejected here,
  // must not leave the form showing something nobody recorded.
  useEffect(() => {
    reset({ status: presence.status, note: presence.note });
  }, [presence.status, presence.note, reset]);

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await tracker.setPresence(values.status, values.note);
    } catch (cause: unknown) {
      console.error('Setting presence failed', cause);
      setError(messageOf(cause, FAILED));
      reset({ status: presence.status, note: presence.note });
    }
  });

  const apply = (): void => {
    submit().catch((cause: unknown) => console.error('Setting presence failed', cause));
  };

  return (
    <YStack gap="$3">
      <SelectField
        control={control}
        name="status"
        label="My status"
        options={STATUS_OPTIONS}
        disabled={busy}
        onChanged={apply}
      />
      <TextField
        control={control}
        name="note"
        label="Note (optional)"
        placeholder="Back at 2"
        hint={`Up to ${PRESENCE_NOTE_MAX} characters.`}
        disabled={busy}
        onSubmitEditing={apply}
      />
      {noteChanged ? (
        <AppButton
          label="Save note"
          tone="outlined"
          icon="content-save-outline"
          busy={busy}
          onPress={apply}
        />
      ) : null}
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <Caption>{presenceCaption(presence, timezone, Date.now())}</Caption>
    </YStack>
  );
}
