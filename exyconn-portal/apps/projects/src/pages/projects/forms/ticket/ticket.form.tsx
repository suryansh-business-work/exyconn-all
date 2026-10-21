import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfChipsInput,
  RhfDatePicker,
  RhfRichText,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { useT } from '@exyconn/i18n';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { Grid } from '@exyconn/shell/components/ui';
import { TaskPriority, TaskType, type TaskInput } from '@exyconn/shell/graphql/generated';
import { TICKET_PRIORITY_OPTIONS, TICKET_TYPE_OPTIONS } from '../../ticket/ticket-meta';
import type { TicketAssigneeOption, TicketOption, TicketRow } from './ticket.types';

/** Points are a rough size, not a budget: a three-digit estimate is a typo. */
const MAX_POINTS = 999;

const schema = z.object({
  title: z.string().trim().min(1, 'Summary is required'),
  description: z.string(),
  type: z.enum(TaskType),
  priority: z.enum(TaskPriority),
  assigneeId: z.string(),
  labels: z.array(z.string()),
  storyPoints: z
    .string()
    .refine((value) => value === '' || Number(value) >= 0, 'Points cannot be negative')
    .refine(
      (value) => value === '' || Number(value) <= MAX_POINTS,
      `Points must be ≤ ${MAX_POINTS}`,
    )
    .refine((value) => value === '' || Number.isInteger(Number(value)), 'Points must be whole'),
  dueDate: z.string(),
  parentTaskId: z.string(),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
export function toTaskInput(values: Values): TaskInput {
  return {
    title: values.title,
    description: values.description,
    type: values.type,
    priority: values.priority,
    assigneeId: values.assigneeId,
    labels: values.labels,
    storyPoints: values.storyPoints === '' ? null : Number(values.storyPoints),
    dueDate: values.dueDate === '' ? null : values.dueDate,
    // An epic is the top of the tree, so whatever the picker last held is dropped for one.
    parentTaskId:
      values.type === TaskType.Epic || values.parentTaskId === '' ? null : values.parentTaskId,
  };
}

const toInitial = (row: TicketRow | null): Values => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  type: row?.type ?? TaskType.Task,
  priority: row?.priority ?? TaskPriority.Medium,
  assigneeId: row?.assigneeId ?? '',
  labels: row?.labels ? [...row.labels] : [],
  storyPoints:
    row?.storyPoints === null || row?.storyPoints === undefined ? '' : String(row.storyPoints),
  dueDate: row?.dueDate ?? '',
  parentTaskId: row?.parentTaskId ?? '',
});

interface TicketFormProps {
  initial: TicketRow | null;
  assignees: TicketAssigneeOption[];
  /** The project's epics, for filing this ticket under one. */
  epics: TicketOption[];
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * The whole of a ticket, as one React Hook Form + Zod form: the summary and the rich
 * description on the left, and the fields a board is filtered and sorted by on the right.
 */
export function TicketForm({
  initial,
  assignees,
  epics,
  onSubmit,
  onCancel,
}: Readonly<TicketFormProps>) {
  const t = useT();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const isEpic = methods.watch('type') === TaskType.Epic;
  const epicOptions = [{ value: '', label: t('No epic') }, ...epics];
  const assigneeOptions = [{ value: '', label: t('Unassigned') }, ...assignees];
  const typeOptions = TICKET_TYPE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }));
  const priorityOptions = TICKET_PRIORITY_OPTIONS.map((o) => ({ ...o, label: t(o.label) }));

  return (
    <EntityForm
      methods={methods}
      onSubmit={(values: Values) => onSubmit(toTaskInput(values))}
      isEdit={initial !== null}
      onCancel={onCancel}
      submitLabel="Save ticket"
    >
      <RhfTextField
        name="title"
        label="Summary"
        helperText="A short line saying what needs doing, e.g. Fix login on Safari."
      />
      <RhfRichText
        name="description"
        label="Description"
        helperText="Optional. Details, steps to reproduce or acceptance criteria."
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfSelect
            name="type"
            label="Type"
            options={typeOptions}
            helperText="Story, task, bug or epic; an epic groups other tickets."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfSelect
            name="priority"
            label="Priority"
            options={priorityOptions}
            helperText="How urgent it is, from Lowest to Highest."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfAutocomplete
            name="assigneeId"
            label="Assignee"
            options={assigneeOptions}
            helperText="Who works on the ticket; leave Unassigned if nobody yet."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfTextField
            name="storyPoints"
            label="Story points"
            helperText="Optional. A rough size as a whole number, e.g. 3."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfDatePicker
            name="dueDate"
            label="Due date"
            helperText="Optional. When the ticket should be done."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RhfChipsInput name="labels" label="Labels" helperText="Type a label and press Enter" />
        </Grid>
        {isEpic ? null : (
          <Grid size={{ xs: 12 }}>
            <RhfAutocomplete
              name="parentTaskId"
              label="Epic"
              options={epicOptions}
              helperText="The epic this ticket is part of"
            />
          </Grid>
        )}
      </Grid>
    </EntityForm>
  );
}
