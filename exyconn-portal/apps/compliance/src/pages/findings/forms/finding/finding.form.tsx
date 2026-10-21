import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RhfAttachmentPicker, COMPLIANCE_UPLOAD_FOLDER } from '@exyconn/shell/components/upload';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  FindingSource,
  FindingStatus,
  FindingType,
  useCreateFindingMutation,
  useUpdateFindingMutation,
  useListInternalAuditsQuery,
  useListRisksQuery,
} from '@exyconn/shell/graphql/generated';
import { CATEGORY_OPTIONS, STANDARD_OPTIONS } from '../../../compliance.options';
import { findingSchema, toFindingInput, toFindingValues } from './finding.schema';
import { FindingVerificationFields } from './finding-verification.fields';
import type { FindingRow } from './finding.types';

const SOURCE_OPTIONS = enumOptions(Object.values(FindingSource));
const TYPE_OPTIONS = enumOptions(Object.values(FindingType));
const STATUS_OPTIONS = enumOptions(Object.values(FindingStatus));

const NONE: SelectOption = { value: '', label: 'None' };

type Values = z.infer<typeof findingSchema>;

interface FindingFormProps {
  initial: FindingRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** A nonconformity and the corrective action taken about it, from raising to verification. */
export function FindingForm({ initial, onDone, onCancel }: Readonly<FindingFormProps>) {
  const [createFinding] = useCreateFindingMutation();
  const [updateFinding] = useUpdateFindingMutation();
  const { data: auditsData } = useListInternalAuditsQuery();
  const { data: risksData } = useListRisksQuery();
  const methods = useForm<z.input<typeof findingSchema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(findingSchema),
    defaultValues: toFindingValues(initial),
  });

  const auditOptions: SelectOption[] = [
    NONE,
    ...(auditsData?.listInternalAudits ?? []).map((audit) => ({
      value: audit.id,
      label: `${audit.reference} — ${audit.title}`,
    })),
  ];
  const riskOptions: SelectOption[] = [
    NONE,
    ...(risksData?.listRisks ?? []).map((risk) => ({
      value: risk.id,
      label: `${risk.reference} — ${risk.title}`,
    })),
  ];

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Finding',
    initial,
    create: (v: Values) => createFinding({ variables: { input: toFindingInput(v) } }),
    update: (row, v) => updateFinding({ variables: { id: row.id, input: toFindingInput(v) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="title"
        label="Finding"
        helperText="A short summary of the problem, e.g. Leavers keep VPN access."
      />
      <RhfTextField
        name="description"
        label="What was found"
        multiline
        rows={3}
        helperText="Optional. The evidence and where it was seen."
      />
      <RhfSelect
        name="source"
        label="Raised by"
        options={SOURCE_OPTIONS}
        helperText="Where the finding came from, e.g. an internal audit or a customer complaint."
      />
      <RhfSelect
        name="auditId"
        label="Audit"
        options={auditOptions}
        helperText="Optional. The audit that raised it, if any."
      />
      <RhfSelect
        name="riskId"
        label="Related risk"
        options={riskOptions}
        helperText="Optional. The register risk this finding affects."
      />
      <RhfMultiSelect
        name="standards"
        label="Standards"
        options={STANDARD_OPTIONS}
        helperText="The ISO standards the finding relates to. Pick at least one."
      />
      <RhfSelect
        name="category"
        label="Category"
        options={CATEGORY_OPTIONS}
        helperText="The area it belongs to, e.g. quality or information security."
      />
      <RhfTextField name="clause" label="Clause" helperText="e.g. 27001:A.5.18" />
      <RhfSelect
        name="type"
        label="Type"
        options={TYPE_OPTIONS}
        helperText="How serious it is: a major or minor nonconformity, an observation or an opportunity."
      />
      <RhfTextField
        name="immediateAction"
        label="Immediate action"
        multiline
        rows={2}
        helperText="What was done at once to contain it"
      />
      <RhfTextField
        name="rootCause"
        label="Root cause"
        multiline
        rows={2}
        helperText="Optional. Why it happened, not just what happened."
      />
      <RhfTextField
        name="correctiveAction"
        label="Corrective action"
        multiline
        rows={3}
        helperText="What is being changed so it does not happen again"
      />
      <RhfTextField
        name="ownerName"
        label="Owner"
        helperText="The person responsible for putting it right."
      />
      <RhfDatePicker
        name="raisedOn"
        label="Raised on"
        helperText="The date the finding was recorded."
      />
      <RhfDatePicker
        name="dueOn"
        label="Due"
        helperText="Optional. When the corrective action should be done by."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Where it stands. Closing needs a verification date and an effectiveness answer."
      />
      <FindingVerificationFields />
      <RhfAttachmentPicker
        name="evidence"
        folder={COMPLIANCE_UPLOAD_FOLDER}
        helperText="Optional. Screenshots, reports or records that show the finding and its fix."
      />
    </EntityForm>
  );
}
