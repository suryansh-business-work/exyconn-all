import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfChipsInput,
  RhfDatePicker,
  RhfRichText,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { Grid2 } from '@exyconn/shell/components/ui';
import { TaskPriority, TaskType, type TaskInput } from '@exyconn/shell/graphql/generated';
import { TICKET_PRIORITY_OPTIONS, TICKET_TYPE_OPTIONS } from '../../ticket/ticket-meta';
import type { TicketAssigneeOption, TicketRow } from './ticket.types';

/** Points are a rough size, not a budget: a three-digit estimate is a typo. */
const MAX_POINTS = 999;

const schema = z.object({
  title: z.string().trim().min(1, 'Summary is required'),
  description: z.string(),
  type: z.nativeEnum(TaskType),
  priority: z.nativeEnum(TaskPriority),
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
});

interface TicketFormProps {
  initial: TicketRow | null;
  assignees: TicketAssigneeOption[];
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * The whole of a ticket, as one React Hook Form + Zod form: the summary and the rich
 * description on the left, and the fields a board is filtered and sorted by on the right.
 */
export function TicketForm({ initial, assignees, onSubmit, onCancel }: Readonly<TicketFormProps>) {
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const assigneeOptions = [{ value: '', label: 'Unassigned' }, ...assignees];

  return (
    <EntityForm
      methods={methods}
      onSubmit={(values: Values) => onSubmit(toTaskInput(values))}
      isEdit={initial !== null}
      onCancel={onCancel}
      submitLabel="Save ticket"
    >
      <RhfTextField name="title" label="Summary" />
      <RhfRichText name="description" label="Description" />

      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfSelect name="type" label="Type" options={TICKET_TYPE_OPTIONS} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfSelect name="priority" label="Priority" options={TICKET_PRIORITY_OPTIONS} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfAutocomplete name="assigneeId" label="Assignee" options={assigneeOptions} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfTextField name="storyPoints" label="Story points" />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfDatePicker name="dueDate" label="Due date" />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <RhfChipsInput name="labels" label="Labels" helperText="Type a label and press Enter" />
        </Grid2>
      </Grid2>
    </EntityForm>
  );
}
