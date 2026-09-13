import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateRiskMutation, useUpdateRiskMutation } from '@exyconn/shell/graphql/generated';
import {
  CATEGORY_OPTIONS,
  RISK_SCALE_OPTIONS,
  RISK_STATUS_OPTIONS,
  RISK_TREATMENT_OPTIONS,
  STANDARD_OPTIONS,
} from '../../../compliance.options';
import { riskSchema, toRiskInput, toRiskValues } from './risk.schema';
import { ratingHint } from './risk.rating';
import type { RiskRow } from './risk.types';

type Values = z.infer<typeof riskSchema>;

interface RiskFormProps {
  initial: RiskRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * One risk on the register.
 *
 * The two ratings are asked for separately on purpose: the first is the risk as it would be
 * with nothing done about it, the second what is left once the controls named above it work.
 * Each shows its band as it is chosen, so nobody has to multiply in their head.
 */
export function RiskForm({ initial, onDone, onCancel }: Readonly<RiskFormProps>) {
  const [createRisk] = useCreateRiskMutation();
  const [updateRisk] = useUpdateRiskMutation();
  const methods = useForm<z.input<typeof riskSchema>, unknown, Values>({
    resolver: zodResolver(riskSchema),
    defaultValues: toRiskValues(initial),
  });

  const values = useWatch({ control: methods.control });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Risk',
    initial,
    create: (v: Values) => createRisk({ variables: { input: toRiskInput(v) } }),
    update: (row, v) => updateRisk({ variables: { id: row.id, input: toRiskInput(v) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Risk" helperText="What could happen, in one line" />
      <RhfTextField name="description" label="Description" multiline rows={3} />
      <RhfMultiSelect name="standards" label="Standards" options={STANDARD_OPTIONS} />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="The process, system, site or asset it is about"
      />
      <RhfTextField name="ownerName" label="Owner" />
      <RhfSelect name="likelihood" label="Likelihood" options={RISK_SCALE_OPTIONS} />
      <RhfSelect
        name="impact"
        label="Impact"
        options={RISK_SCALE_OPTIONS}
        helperText={ratingHint('Inherent', values.likelihood, values.impact)}
      />
      <RhfSelect name="treatment" label="Treatment" options={RISK_TREATMENT_OPTIONS} />
      <RhfTextField
        name="controls"
        label="Controls"
        multiline
        rows={3}
        helperText="What is in place or planned — what the residual rating below assumes"
      />
      <RhfSelect
        name="residualLikelihood"
        label="Residual likelihood"
        options={RISK_SCALE_OPTIONS}
      />
      <RhfSelect
        name="residualImpact"
        label="Residual impact"
        options={RISK_SCALE_OPTIONS}
        helperText={ratingHint('Residual', values.residualLikelihood, values.residualImpact)}
      />
      <RhfSelect name="status" label="Status" options={RISK_STATUS_OPTIONS} />
      <RhfDatePicker name="identifiedOn" label="Identified on" />
      <RhfDatePicker name="reviewDueOn" label="Review due" />
    </EntityForm>
  );
}
