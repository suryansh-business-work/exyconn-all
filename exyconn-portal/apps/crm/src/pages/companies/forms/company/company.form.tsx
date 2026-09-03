import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  CompanyStatus,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from '@exyconn/shell/graphql/generated';
import { COMPANY_SIZES } from '../../crm.constants';
import type { CompanyRow } from './company.types';

const STATUS_OPTIONS = enumOptions(Object.values(CompanyStatus));
const SIZE_OPTIONS: SelectOption[] = COMPANY_SIZES.map((size) => ({
  value: size,
  label: `${size} people`,
}));

/** A domain, not a URL — "exyconn.com", so two rows for one company are avoidable. */
const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  domain: z
    .string()
    .trim()
    .min(1, 'Domain is required')
    .regex(DOMAIN_PATTERN, 'Enter the domain on its own, e.g. exyconn.com'),
  industry: z.string().trim(),
  size: z.enum(COMPANY_SIZES),
  status: z.nativeEnum(CompanyStatus),
  phone: z.string().trim(),
  location: z.string().trim(),
  owner: z.string().trim().min(1, 'Owner is required'),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CompanyRow | null): Values => ({
  name: row?.name ?? '',
  domain: row?.domain ?? '',
  industry: row?.industry ?? '',
  size: (row?.size as Values['size']) ?? COMPANY_SIZES[0],
  status: row?.status ?? CompanyStatus.Prospect,
  phone: row?.phone ?? '',
  location: row?.location ?? '',
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
});

interface CompanyFormProps {
  initial: CompanyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an account. */
export function CompanyForm({ initial, onDone, onCancel }: Readonly<CompanyFormProps>) {
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Company',
    initial,
    create: (values: Values) => createCompany({ variables: { input: values } }),
    update: (row, values) => updateCompany({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Company name" />
      <RhfTextField name="domain" label="Domain" helperText="e.g. exyconn.com" />
      <RhfTextField name="industry" label="Industry" />
      <RhfSelect name="size" label="Size" options={SIZE_OPTIONS} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="owner" label="Owner" />
      <RhfTextField name="phone" label="Phone" />
      <RhfTextField name="location" label="Location" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
