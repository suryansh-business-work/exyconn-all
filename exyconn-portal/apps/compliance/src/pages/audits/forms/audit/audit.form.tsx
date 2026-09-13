import { useForm } from 'react-hook-form';
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
  AuditKind,
  AuditStatus,
  useCreateInternalAuditMutation,
  useUpdateInternalAuditMutation,
} from '@exyconn/shell/graphql/generated';
import { STANDARD_OPTIONS } from '../../../compliance.options';
import { auditSchema, toAuditInput, toAuditValues } from './audit.schema';
import type { AuditRow } from './audit.types';

const KIND_OPTIONS = enumOptions(Object.values(AuditKind));
const STATUS_OPTIONS = enumOptions(Object.values(AuditStatus));

type Values = z.infer<typeof auditSchema>;

interface AuditFormProps {
  initial: AuditRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * One audit, planned before it happens and reported after (clause 9.2).
 *
 * The same form does both: an audit is planned with a scope and a date, and the report is
 * written onto the row it was planned as, so the programme and its results are one record.
 */
export function AuditForm({ initial, onDone, onCancel }: Readonly<AuditFormProps>) {
  const [createAudit] = useCreateInternalAuditMutation();
  const [updateAudit] = useUpdateInternalAuditMutation();
  const methods = useForm<z.input<typeof auditSchema>, unknown, Values>({
    resolver: zodResolver(auditSchema),
    defaultValues: toAuditValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Audit',
    initial,
    create: (v: Values) => createAudit({ variables: { input: toAuditInput(v) } }),
    update: (row, v) => updateAudit({ variables: { id: row.id, input: toAuditInput(v) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Audit" />
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} />
      <RhfMultiSelect name="standards" label="Standards" options={STANDARD_OPTIONS} />
      <RhfTextField
        name="scope"
        label="Scope"
        helperText="What is being audited — a process, a department, a site, a supplier"
      />
      <RhfTextField
        name="criteria"
        label="Criteria"
        multiline
        rows={2}
        helperText="What it is audited against — clauses, a policy, a contract"
      />
      <RhfTextField name="leadAuditorName" label="Lead auditor" />
      <RhfTextField name="auditeeName" label="Auditee" />
      <RhfDatePicker name="plannedOn" label="Planned for" />
      <RhfDatePicker name="performedOn" label="Carried out on" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="summary" label="What was looked at" multiline rows={3} />
      <RhfTextField name="conclusion" label="Conclusion" multiline rows={3} />
    </EntityForm>
  );
}
