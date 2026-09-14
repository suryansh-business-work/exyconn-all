import { useForm } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
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
import {
  EFFECTIVE_NO,
  EFFECTIVE_UNANSWERED,
  EFFECTIVE_YES,
  findingSchema,
  toFindingInput,
  toFindingValues,
} from './finding.schema';
import type { FindingRow } from './finding.types';

const SOURCE_OPTIONS = enumOptions(Object.values(FindingSource));
const TYPE_OPTIONS = enumOptions(Object.values(FindingType));
const STATUS_OPTIONS = enumOptions(Object.values(FindingStatus));

/** Not a checkbox: "nobody has checked yet" is a different answer from "it did not work". */
const EFFECTIVE_OPTIONS: SelectOption[] = [
  { value: EFFECTIVE_UNANSWERED, label: 'Not checked yet' },
  { value: EFFECTIVE_YES, label: 'Yes — it worked' },
  { value: EFFECTIVE_NO, label: 'No — it did not' },
];

const NONE: SelectOption = { value: '', label: 'None' };

type Values = z.infer<typeof findingSchema>;

interface FindingFormProps {
  initial: FindingRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** A nonconformity and the corrective action taken about it, from raising to verification. */
export function FindingForm({ initial, onDone, onCancel }: Readonly<FindingFormProps>) {
  const t = useT();
  const [createFinding] = useCreateFindingMutation();
  const [updateFinding] = useUpdateFindingMutation();
  const { data: auditsData } = useListInternalAuditsQuery();
  const { data: risksData } = useListRisksQuery();
  const methods = useForm<z.input<typeof findingSchema>, unknown, Values>({
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
      <RhfTextField name="title" label="Finding" />
      <RhfTextField name="description" label="What was found" multiline rows={3} />
      <RhfSelect name="source" label="Raised by" options={SOURCE_OPTIONS} />
      <RhfSelect name="auditId" label="Audit" options={auditOptions} />
      <RhfSelect name="riskId" label="Related risk" options={riskOptions} />
      <RhfMultiSelect name="standards" label="Standards" options={STANDARD_OPTIONS} />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfTextField name="clause" label="Clause" helperText="e.g. 27001:A.5.18" />
      <RhfSelect name="type" label="Type" options={TYPE_OPTIONS} />
      <RhfTextField
        name="immediateAction"
        label="Immediate action"
        multiline
        rows={2}
        helperText="What was done at once to contain it"
      />
      <RhfTextField name="rootCause" label="Root cause" multiline rows={2} />
      <RhfTextField
        name="correctiveAction"
        label="Corrective action"
        multiline
        rows={3}
        helperText="What is being changed so it does not happen again"
      />
      <RhfTextField name="ownerName" label="Owner" />
      <RhfDatePicker name="raisedOn" label="Raised on" />
      <RhfDatePicker name="dueOn" label="Due" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfDatePicker name="verifiedOn" label="Verified on" />
      <RhfTextField name="verifiedByName" label="Verified by" />
      <RhfSelect
        name="effective"
        label="Was it effective?"
        options={EFFECTIVE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
      />
      <RhfTextField name="effectivenessNote" label="Evidence" multiline rows={2} />
    </EntityForm>
  );
}
