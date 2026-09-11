import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { XStack, YStack } from 'tamagui';
import type { TrackerProject } from '@exyconn/tracker-core';
import { DateTimeField } from '../../components/form/DateTimeField';
import { SelectField } from '../../components/form/SelectField';
import { TextField } from '../../components/form/TextField';
import { AppButton } from '../../components/ui/AppButton';
import { Notice } from '../../components/ui/Notice';
import type { Option } from '../../components/ui/OptionSheet';
import { Caption } from '../../components/ui/Typography';
import { useProjectTasks } from '../../hooks/useProjectTasks';
import { tracker } from '../../tracker/instance';
import { messageOf } from '../../tracker/run';
import { MANUAL_ENTRY_LIMITS, manualEntrySchema } from './manual-entry.schema';
import type { ManualEntryInput, ManualEntryValues } from './manual-entry.types';

const NO_TICKET = '';
const FILE_FAILED = 'The claim could not be filed.';

interface Props {
  projects: readonly TrackerProject[];
  /** The employee's chosen zone — the window is shown in it, like every other time. */
  timezone: string;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Claims work done away from the phone — a client meeting, a site visit, a call.
 *
 * The form holds the portal's own limits (see the schema) so an impossible window is refused
 * here, in the portal's words; anything it still refuses is shown verbatim rather than
 * second-guessed.
 */
export function ManualEntryForm({ projects, timezone, onCancel, onDone }: Readonly<Props>) {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, setValue, formState } = useForm<
    ManualEntryInput,
    unknown,
    ManualEntryValues
  >({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      projectId: projects[0]?.id ?? '',
      taskId: NO_TICKET,
      startedAt: '',
      endedAt: '',
      note: '',
    },
  });
  const projectId = useWatch({ control, name: 'projectId' });
  const tasks = useProjectTasks(projectId);
  const busy = formState.isSubmitting;
  const now = new Date();
  const earliest = new Date(now.getTime() - MANUAL_ENTRY_LIMITS.maxBackdateMs);

  const projectOptions = useMemo<Option[]>(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );
  const ticketOptions = useMemo<Option[]>(
    () => [
      { value: NO_TICKET, label: 'No ticket' },
      ...tasks.map((task) => ({ value: task.id, label: `${task.key} · ${task.title}` })),
    ],
    [tasks],
  );

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await tracker.createManualEntry(values);
      onDone();
    } catch (cause: unknown) {
      console.error('Filing the claim failed', cause);
      setError(messageOf(cause, FILE_FAILED));
    }
  });

  return (
    <YStack gap="$3">
      <Caption>
        Claimed hours are the one thing the tracker did not measure, so they wait for a manager.
        Nothing here counts until somebody approves it.
      </Caption>
      {error === null ? null : <Notice severity="error">{error}</Notice>}
      <SelectField
        control={control}
        name="projectId"
        label="Project"
        options={projectOptions}
        disabled={busy}
        searchable
        // The ticket belonged to the old project; it cannot follow the claim to a new one.
        onChanged={() => setValue('taskId', NO_TICKET)}
      />
      <SelectField
        control={control}
        name="taskId"
        label="Ticket"
        options={ticketOptions}
        disabled={busy}
        searchable
      />
      <DateTimeField
        control={control}
        name="startedAt"
        label="From"
        timezone={timezone}
        minimumDate={earliest}
        maximumDate={now}
      />
      <DateTimeField
        control={control}
        name="endedAt"
        label="To"
        timezone={timezone}
        hint="Time you have already worked, within the last 90 days."
        minimumDate={earliest}
        maximumDate={now}
      />
      <TextField
        control={control}
        name="note"
        label="What was the time for?"
        hint="Your reviewer sees this — a meeting, a site visit, a call."
        multiline
        disabled={busy}
      />
      <XStack gap="$3" justifyContent="flex-end">
        <AppButton label="Cancel" tone="text" onPress={onCancel} disabled={busy} />
        <AppButton
          label="Submit claim"
          icon="send-clock-outline"
          busy={busy}
          onPress={() => {
            submit().catch((cause: unknown) => console.error('Filing the claim failed', cause));
          }}
        />
      </XStack>
    </YStack>
  );
}
