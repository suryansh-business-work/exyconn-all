import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid } from '@exyconn/shell/components/ui';
import { RhfDateTimePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  MyTrackerManualEntriesDocument,
  useCreateTrackerManualEntryMutation,
} from '@exyconn/shell/graphql/generated';

/** Mirrors the server's own bounds, so the form says no before the round-trip does. */
const MAX_HOURS = 16;
const MS_PER_HOUR = 3_600_000;

const schema = z
  .object({
    startedAt: z.string().min(1, 'When did the work start?'),
    endedAt: z.string().min(1, 'When did it end?'),
    projectId: z.string(),
    note: z.string().trim().min(3, 'Say what the time was for'),
  })
  .refine((values) => new Date(values.endedAt) > new Date(values.startedAt), {
    path: ['endedAt'],
    message: 'The entry must end after it starts',
  })
  .refine(
    (values) =>
      new Date(values.endedAt).getTime() - new Date(values.startedAt).getTime() <=
      MAX_HOURS * MS_PER_HOUR,
    { path: ['endedAt'], message: `One entry cannot cover more than ${MAX_HOURS} hours` },
  );

type Values = z.infer<typeof schema>;

interface OffComputerTimeFormProps {
  /** Projects the employee may book against; the house-wide one is first. */
  projects: ReadonlyArray<{ id: string; name: string }>;
  onDone: () => void;
}

/**
 * Claims work done away from the computer.
 *
 * It submits as PENDING and says so — the employee should not leave thinking the hours are
 * already on their timesheet.
 */
export function OffComputerTimeForm({ projects, onDone }: Readonly<OffComputerTimeFormProps>) {
  const notify = useNotify();
  const [createEntry] = useCreateTrackerManualEntryMutation({
    refetchQueries: [MyTrackerManualEntriesDocument],
  });
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { startedAt: '', endedAt: '', projectId: projects[0]?.id ?? '', note: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await createEntry({
        variables: {
          input: {
            startedAt: values.startedAt,
            endedAt: values.endedAt,
            projectId: values.projectId || null,
            note: values.note,
          },
        },
      });
      notify('Sent for approval');
      methods.reset();
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send the entry', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onDone}
      submitLabel="Send for approval"
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <RhfDateTimePicker name="startedAt" label="Started" maxDateTime={new Date()} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RhfDateTimePicker
            name="endedAt"
            label="Ended"
            maxDateTime={new Date()}
            helperText="Time you have already worked"
          />
        </Grid>
      </Grid>
      <RhfSelect
        name="projectId"
        label="Project"
        options={projects.map((project) => ({ value: project.id, label: project.name }))}
      />
      <RhfTextField
        name="note"
        label="What was the time for?"
        multiline
        minRows={2}
        helperText="Your reviewer sees this — a meeting, a site visit, a call."
      />
    </EntityForm>
  );
}
