import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfDatePicker,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ExitStage,
  useListUsersQuery,
  useCreateExitRecordMutation,
  useUpdateExitRecordMutation,
} from '@exyconn/shell/graphql/generated';
import type { ExitRecordRow } from './exit-record.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  resignationDate: z.string().min(1, 'Resignation date is required'),
  lastWorkingDate: z.string(),
  noticePeriodDays: z.coerce
    .number({ message: 'Notice period (days) must be a number' })
    .min(0, 'Must be ≥ 0'),
  reason: z.string().trim(),
  stage: z.nativeEnum(ExitStage),
  assetsReturned: z.boolean(),
  knowledgeTransferDone: z.boolean(),
  exitInterviewNotes: z.string().trim(),
  finalSettlementAmount: z.union([z.literal(''), z.coerce.number().min(0, 'Must be ≥ 0')]),
  documentsIssued: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ExitRecordRow | null) => ({
  employeeId: row?.employeeId ?? '',
  resignationDate: row?.resignationDate ?? '',
  lastWorkingDate: row?.lastWorkingDate ?? '',
  noticePeriodDays: row?.noticePeriodDays ?? 0,
  reason: row?.reason ?? '',
  stage: row?.stage ?? Object.values(ExitStage)[0],
  assetsReturned: row?.assetsReturned ?? false,
  knowledgeTransferDone: row?.knowledgeTransferDone ?? false,
  exitInterviewNotes: row?.exitInterviewNotes ?? '',
  finalSettlementAmount: row?.finalSettlementAmount ?? '',
  documentsIssued: row?.documentsIssued ?? false,
});

/** Only the genuinely nullable inputs become null; the rest are `String!`. */
const toInput = (values: Values) => ({
  ...values,
  finalSettlementAmount: values.finalSettlementAmount === '' ? null : values.finalSettlementAmount,
  lastWorkingDate: values.lastWorkingDate === '' ? null : values.lastWorkingDate,
});

interface ExitRecordFormProps {
  initial: ExitRecordRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an exit record. */
export function ExitRecordForm({ initial, onDone, onCancel }: Readonly<ExitRecordFormProps>) {
  const [createExitRecord] = useCreateExitRecordMutation();
  const [updateExitRecord] = useUpdateExitRecordMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'ExitRecord',
    initial,
    create: (values: Values) => createExitRecord({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateExitRecord({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfDatePicker name="resignationDate" label="Resignation date" />
      <RhfDatePicker name="lastWorkingDate" label="Last working date" />
      <RhfTextField name="noticePeriodDays" label="Notice period (days)" type="number" />
      <RhfTextField name="reason" label="Reason" multiline minRows={3} />
      <RhfSelect name="stage" label="Stage" options={enumOptions(Object.values(ExitStage))} />
      <RhfSwitch name="assetsReturned" label="Assets returned" />
      <RhfSwitch name="knowledgeTransferDone" label="Knowledge transfer done" />
      <RhfTextField name="exitInterviewNotes" label="Exit interview notes" multiline minRows={3} />
      <RhfTextField name="finalSettlementAmount" label="Final settlement" type="number" />
      <RhfSwitch name="documentsIssued" label="Documents issued" />
    </EntityForm>
  );
}
