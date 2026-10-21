import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  ObjectiveFrequency,
  ObjectiveScope,
  ObjectiveStatus,
  useCreateObjectiveMutation,
  useUpdateObjectiveMutation,
} from '@exyconn/shell/graphql/generated';
import { CATEGORY_OPTIONS, STANDARD_OPTIONS } from '../../../compliance.options';
import { achievementHint } from './objective.progress';
import { objectiveSchema, toObjectiveInput, toObjectiveValues } from './objective.schema';
import type { ObjectiveRow } from './objective.types';

const SCOPE_OPTIONS = enumOptions(Object.values(ObjectiveScope));
const FREQUENCY_OPTIONS = enumOptions(Object.values(ObjectiveFrequency));
const STATUS_OPTIONS = enumOptions(Object.values(ObjectiveStatus));

type Values = z.infer<typeof objectiveSchema>;

interface ObjectiveFormProps {
  initial: ObjectiveRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * One measurable objective (clause 6.2).
 *
 * Three numbers rather than a percentage: an objective to REDUCE something reads as progress
 * when its measure falls, which a single "percent complete" field can never express.
 */
export function ObjectiveForm({ initial, onDone, onCancel }: Readonly<ObjectiveFormProps>) {
  const [createObjective] = useCreateObjectiveMutation();
  const [updateObjective] = useUpdateObjectiveMutation();
  const methods = useForm<z.input<typeof objectiveSchema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(objectiveSchema),
    defaultValues: toObjectiveValues(initial),
  });

  const values = useWatch({ control: methods.control });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Objective',
    initial,
    create: (v: Values) => createObjective({ variables: { input: toObjectiveInput(v) } }),
    update: (row, v) => updateObjective({ variables: { id: row.id, input: toObjectiveInput(v) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="title"
        label="Objective"
        helperText="What should be achieved, e.g. Cut customer complaints by a third."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        rows={2}
        helperText="Optional. Why this objective matters and how it supports the policy."
      />
      <RhfMultiSelect
        name="standards"
        label="Standards"
        options={STANDARD_OPTIONS}
        helperText="The ISO standards this objective supports. Pick at least one."
      />
      <RhfSelect
        name="category"
        label="Category"
        options={CATEGORY_OPTIONS}
        helperText="The area it belongs to, e.g. quality or information security."
      />
      <RhfSelect
        name="scope"
        label="Scope"
        options={SCOPE_OPTIONS}
        helperText="Whether it applies to the whole company, one department or one process."
      />
      <RhfTextField
        name="area"
        label="Department or process"
        helperText="Leave empty for a company-wide objective"
      />
      <RhfTextField
        name="ownerName"
        label="Owner"
        helperText="The person accountable for meeting the objective."
      />
      <RhfTextField
        name="measure"
        label="Measured by"
        helperText="e.g. complaints per 1,000 orders"
      />
      <RhfTextField
        name="unit"
        label="Unit"
        helperText="Optional. The unit of the figures below, e.g. %, hours or count."
      />
      <RhfTextField
        name="baseline"
        label="Baseline"
        type="number"
        helperText="The value of the measure when the objective was set."
      />
      <RhfTextField
        name="target"
        label="Target"
        type="number"
        helperText="The value to reach by the end of the period. Must differ from the baseline."
      />
      <RhfTextField
        name="actual"
        label="Current value"
        type="number"
        helperText={achievementHint(values.baseline, values.target, values.actual)}
      />
      <RhfSelect
        name="frequency"
        label="Measured"
        options={FREQUENCY_OPTIONS}
        helperText="How often the current value is checked and updated."
      />
      <RhfDatePicker
        name="periodStart"
        label="Period starts"
        helperText="The first day the objective is measured from."
      />
      <RhfDatePicker
        name="periodEnd"
        label="Period ends"
        helperText="The date the target should be met by; cannot be before the start."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Whether it is planned, on track, at risk, met or missed."
      />
      <RhfTextField
        name="plan"
        label="Plan"
        multiline
        rows={3}
        helperText="Optional. The actions, resources and steps that will get it done."
      />
    </EntityForm>
  );
}
