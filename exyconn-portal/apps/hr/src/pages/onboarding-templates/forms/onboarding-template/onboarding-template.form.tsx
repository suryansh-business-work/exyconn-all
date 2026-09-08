import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  OnboardingOwner,
  useCreateOnboardingTemplateMutation,
  useUpdateOnboardingTemplateMutation,
} from '@exyconn/shell/graphql/generated';
import { taskKey } from './task-key';
import type { OnboardingTemplateRow } from './onboarding-template.types';

const OWNER_OPTIONS = enumOptions(Object.values(OnboardingOwner));

const taskSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Describe the task')
    .max(120, 'Keep the task under 120 characters'),
  owner: z.nativeEnum(OnboardingOwner),
  dueDaysFromJoin: z.coerce
    .number()
    .int('Whole days only')
    .min(0, 'A task cannot be due before the join date')
    .max(365, 'A year is as far out as onboarding goes'),
});

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').min(3, 'Minimum 3 characters'),
  active: z.boolean(),
  tasks: z
    .array(taskSchema)
    .min(1, 'A template needs at least one task')
    // Keys are derived from the labels, so two tasks that read the same would be one task.
    .refine(
      (tasks) => new Set(tasks.map((task) => taskKey(task.label))).size === tasks.length,
      'Two tasks cannot have the same wording',
    ),
});
type Values = z.infer<typeof schema>;

const EMPTY_TASK = { label: '', owner: OnboardingOwner.Hr, dueDaysFromJoin: 0 };

interface TaskRowProps {
  index: number;
  onRemove: () => void;
}

/** One task row: what it is, who does it, and when it is due. */
function TaskRow({ index, onRemove }: Readonly<TaskRowProps>) {
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
      <Box sx={{ flex: 2, width: '100%' }}>
        <RhfTextField name={`tasks.${index}.label`} label="Task" />
      </Box>
      <Box sx={{ flex: 1, width: '100%' }}>
        <RhfSelect name={`tasks.${index}.owner`} label="Owner" options={OWNER_OPTIONS} />
      </Box>
      <Box sx={{ flex: 1, width: '100%' }}>
        <RhfTextField
          name={`tasks.${index}.dueDaysFromJoin`}
          label="Due (days)"
          type="number"
          inputProps={{ min: 0, max: 365 }}
        />
      </Box>
      <IconButton aria-label={`remove task ${index + 1}`} onClick={onRemove} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}

interface OnboardingTemplateFormProps {
  initial: OnboardingTemplateRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Form defaults: the stored template, or a new one with one empty task to fill in. */
function toValues(initial: OnboardingTemplateRow | null): Values {
  if (!initial) {
    return { name: '', active: true, tasks: [{ ...EMPTY_TASK }] };
  }
  return {
    name: initial.name,
    active: initial.active,
    tasks: initial.tasks.map((task) => ({
      label: task.label,
      owner: task.owner,
      dueDaysFromJoin: task.dueDaysFromJoin,
    })),
  };
}

/** React Hook Form + Zod form to create or update an onboarding template. */
export function OnboardingTemplateForm({
  initial,
  onDone,
  onCancel,
}: Readonly<OnboardingTemplateFormProps>) {
  const [createTemplate] = useCreateOnboardingTemplateMutation();
  const [updateTemplate] = useUpdateOnboardingTemplateMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initial),
  });
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: 'tasks' });

  const toInput = (values: Values) => ({
    name: values.name,
    active: values.active,
    tasks: values.tasks.map((task) => ({ ...task, key: taskKey(task.label) })),
  });

  const { isEdit, onSubmit } = useEntitySave<Values, OnboardingTemplateRow>({
    label: 'Onboarding template',
    initial,
    create: (values) => createTemplate({ variables: { input: toInput(values) } }),
    update: (row, values) => updateTemplate({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Template name" />
      <RhfSwitch name="active" label="Offer this template when starting an onboarding" />
      <Text size="sm" color="text.secondary">
        Each task is copied onto the joiner when their onboarding starts, dated from their join
        date. Editing a template never changes a checklist that has already been started.
      </Text>
      {fields.map((field, index) => (
        <TaskRow key={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append({ ...EMPTY_TASK })}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add task
      </Button>
    </EntityForm>
  );
}
