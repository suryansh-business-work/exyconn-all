import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
      <RhfTextField name="title" label="Objective" />
      <RhfTextField name="description" label="Description" multiline rows={2} />
      <RhfMultiSelect name="standards" label="Standards" options={STANDARD_OPTIONS} />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfSelect name="scope" label="Scope" options={SCOPE_OPTIONS} />
      <RhfTextField
        name="area"
        label="Department or process"
        helperText="Leave empty for a company-wide objective"
      />
      <RhfTextField name="ownerName" label="Owner" />
      <RhfTextField
        name="measure"
        label="Measured by"
        helperText="e.g. complaints per 1,000 orders"
      />
      <RhfTextField name="unit" label="Unit" />
      <RhfTextField name="baseline" label="Baseline" type="number" />
      <RhfTextField name="target" label="Target" type="number" />
      <RhfTextField
        name="actual"
        label="Current value"
        type="number"
        helperText={achievementHint(values.baseline, values.target, values.actual)}
      />
      <RhfSelect name="frequency" label="Measured" options={FREQUENCY_OPTIONS} />
      <RhfDatePicker name="periodStart" label="Period starts" />
      <RhfDatePicker name="periodEnd" label="Period ends" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="plan" label="Plan" multiline rows={3} />
    </EntityForm>
  );
}
