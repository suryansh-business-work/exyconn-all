import { useForm } from 'react-hook-form';
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
    mode: 'onTouched',
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
      <RhfTextField
        name="title"
        label="Audit"
        helperText="A short name for the audit, e.g. Q2 access control audit."
      />
      <RhfSelect
        name="kind"
        label="Kind"
        options={KIND_OPTIONS}
        helperText="Internal, run by an external body, or an audit of a supplier."
      />
      <RhfMultiSelect
        name="standards"
        label="Standards"
        options={STANDARD_OPTIONS}
        helperText="The ISO standards this audit covers. Pick at least one."
      />
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
      <RhfTextField
        name="leadAuditorName"
        label="Lead auditor"
        helperText="The person leading the audit and signing off the report."
      />
      <RhfTextField
        name="auditeeName"
        label="Auditee"
        helperText="Optional. The person or team being audited."
      />
      <RhfDatePicker
        name="plannedOn"
        label="Planned for"
        helperText="The date the audit is scheduled for in the programme."
      />
      <RhfDatePicker
        name="performedOn"
        label="Carried out on"
        helperText="When the audit actually took place. Required once it is reported or closed."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Where the audit stands. Reported or closed needs a date and a conclusion."
      />
      <RhfTextField
        name="summary"
        label="What was looked at"
        multiline
        rows={3}
        helperText="Optional. The records, interviews and samples reviewed."
      />
      <RhfTextField
        name="conclusion"
        label="Conclusion"
        multiline
        rows={3}
        helperText="Whether the area conforms, and why. Required once the audit is reported."
      />
    </EntityForm>
  );
}
