import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  DocumentKind,
  useListUsersQuery,
  useCreateEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmployeeDocumentRow } from './employee-document.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  kind: z.nativeEnum(DocumentKind),
  title: z.string().trim().min(1, 'Title is required'),
  url: z.string().trim().min(1, 'File link is required'),
  issuedOn: z.string().min(1, 'Issued on is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmployeeDocumentRow | null) => ({
  employeeId: row?.employeeId ?? '',
  kind: row?.kind ?? Object.values(DocumentKind)[0],
  title: row?.title ?? '',
  url: row?.url ?? '',
  issuedOn: row?.issuedOn ?? '',
});

const toInput = (values: Values) => values;

interface EmployeeDocumentFormProps {
  initial: EmployeeDocumentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an document. */
export function EmployeeDocumentForm({
  initial,
  onDone,
  onCancel,
}: Readonly<EmployeeDocumentFormProps>) {
  const [createEmployeeDocument] = useCreateEmployeeDocumentMutation();
  const [updateEmployeeDocument] = useUpdateEmployeeDocumentMutation();
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
    label: 'EmployeeDocument',
    initial,
    create: (values: Values) => createEmployeeDocument({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateEmployeeDocument({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfSelect name="kind" label="Type" options={enumOptions(Object.values(DocumentKind))} />
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="url" label="File link" />
      <RhfDatePicker name="issuedOn" label="Issued on" />
    </EntityForm>
  );
}
