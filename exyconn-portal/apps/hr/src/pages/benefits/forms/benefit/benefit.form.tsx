import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
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
  BenefitKind,
  useListUsersQuery,
  useCreateBenefitMutation,
  useUpdateBenefitMutation,
} from '@exyconn/shell/graphql/generated';
import type { BenefitRow } from './benefit.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  kind: z.enum(BenefitKind),
  name: z.string().trim().min(1, 'Name is required'),
  provider: z.string().trim().min(1, 'Provider is required'),
  reference: z.string().trim().min(1, 'Reference is required'),
  coverage: z.string().trim().min(1, 'Coverage is required'),
  validFrom: z.string(),
  validTo: z.string(),
  documentUrl: z
    .string()
    .trim()
    .regex(HTTP_URL, 'Enter a full URL starting with https://')
    .or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BenefitRow | null) => ({
  employeeId: row?.employeeId ?? '',
  kind: row?.kind ?? Object.values(BenefitKind)[0],
  name: row?.name ?? '',
  provider: row?.provider ?? '',
  reference: row?.reference ?? '',
  coverage: row?.coverage ?? '',
  validFrom: row?.validFrom ?? '',
  validTo: row?.validTo ?? '',
  documentUrl: row?.documentUrl ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  validFrom: values.validFrom === '' ? null : values.validFrom,
  validTo: values.validTo === '' ? null : values.validTo,
  documentUrl: values.documentUrl === '' ? null : values.documentUrl,
});

interface BenefitFormProps {
  initial: BenefitRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a benefit. */
export function BenefitForm({ initial, onDone, onCancel }: Readonly<BenefitFormProps>) {
  const [createBenefit] = useCreateBenefitMutation();
  const [updateBenefit] = useUpdateBenefitMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Benefit',
    initial,
    create: (values: Values) => createBenefit({ variables: { input: toInput(values) } }),
    update: (row, values) => updateBenefit({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete
        name="employeeId"
        label="Employee"
        options={employeeOptions}
        helperText="The employee who receives this benefit."
      />
      <RhfSelect
        name="kind"
        label="Type"
        options={enumOptions(Object.values(BenefitKind))}
        helperText="The kind of benefit, e.g. insurance, provident fund or gratuity."
      />
      <RhfTextField
        name="name"
        label="Name"
        helperText="What the benefit is called, e.g. Group health insurance."
      />
      <RhfTextField
        name="provider"
        label="Provider"
        helperText="The insurer or body that provides it, e.g. HDFC Ergo or EPFO."
      />
      <RhfTextField
        name="reference"
        label="Reference"
        helperText="The policy, member or account number for this employee."
      />
      <RhfTextField
        name="coverage"
        label="Coverage"
        helperText="What it covers, e.g. 5,00,000 sum insured for employee and spouse."
      />
      <RhfDatePicker
        name="validFrom"
        label="Valid from"
        helperText="Optional. The day the cover starts."
      />
      <RhfDatePicker
        name="validTo"
        label="Valid to"
        helperText="Optional. The day the cover ends; empty means it does not lapse."
      />
      <RhfTextField
        name="documentUrl"
        label="Document link"
        helperText="Optional. A full link to the policy document, starting with https://."
      />
    </EntityForm>
  );
}
