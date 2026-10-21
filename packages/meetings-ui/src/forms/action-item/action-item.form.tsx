import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import {
  RhfAutocomplete,
  RhfDatePicker,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  MaActionStatus,
  MaPriority,
  useMaCreateActionItemMutation,
  useMaUpdateActionItemMutation,
} from '@exyconn/shell/graphql/generated';
import { useEmployeeOptions } from '../../lib/useEmployeeOptions';
import { toActionInput, toActionValues } from './action-item.mapping';
import type { ActionItemRow, ActionItemValues } from './action-item.types';

const MAX_TITLE = 500;
const MAX_DESCRIPTION = 5000;
const MAX_ASSIGNEE = 200;

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(MAX_TITLE, 'Keep the title under 500 characters'),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION, 'Keep the description under 5,000 characters'),
  assignedTo: z.string().trim().max(MAX_ASSIGNEE, 'Keep the name under 200 characters'),
  assignedUserId: z.string(),
  dueDate: z.string(),
  priority: z.enum(MaPriority),
  status: z.enum(MaActionStatus),
});

interface ActionItemFormProps {
  /** The item being edited, or null to add one to `meetingId`. */
  initial: ActionItemRow | null;
  /** The meeting the item belongs to (a new one is added to it). */
  meetingId: string;
  onDone: () => void;
  onCancel: () => void;
}

/** Adds an action item to a meeting's checklist, or edits one (which confirms an AI guess). */
export function ActionItemForm({
  initial,
  meetingId,
  onDone,
  onCancel,
}: Readonly<ActionItemFormProps>) {
  const t = useT();
  const [createItem] = useMaCreateActionItemMutation();
  const [updateItem] = useMaUpdateActionItemMutation();
  const methods = useForm<ActionItemValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toActionValues(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Action item',
    initial,
    create: (values: ActionItemValues) =>
      createItem({ variables: { meetingId, input: toActionInput(values) } }),
    update: (row, values) =>
      updateItem({ variables: { id: row.id, input: toActionInput(values) } }),
    onDone,
  });
  const translated = (values: string[]) =>
    enumOptions(values).map((option) => ({ ...option, label: t(option.label) }));
  const people = useEmployeeOptions();

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" required />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfTextField
        name="assignedTo"
        label="Owner"
        helperText="The name as it was said in the call, or anyone outside the company"
      />
      <RhfAutocomplete name="assignedUserId" label="Portal user (optional)" options={people} />
      <RhfDatePicker name="dueDate" label="Due date" />
      <RhfSelect name="priority" label="Priority" options={translated(Object.values(MaPriority))} />
      <RhfSelect name="status" label="Status" options={translated(Object.values(MaActionStatus))} />
    </EntityForm>
  );
}
