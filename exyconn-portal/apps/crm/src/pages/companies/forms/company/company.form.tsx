import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DOMAIN, PHONE } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  CompanyStatus,
  CrmObject,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from '@exyconn/shell/graphql/generated';
import { COMPANY_SIZES } from '../../crm.constants';
import {
  CustomFieldsSection,
  CustomPropertiesGate,
  customDefaults,
  customFieldsSchema,
  toCustomInput,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import type { CompanyRow } from './company.types';

const STATUS_OPTIONS = enumOptions(Object.values(CompanyStatus));

const baseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  /** A domain, not a URL — "exyconn.com", so two rows for one company are avoidable. */
  domain: z
    .string()
    .trim()
    .min(1, 'Domain is required')
    .regex(DOMAIN, 'Enter the domain on its own, e.g. exyconn.com'),
  industry: z.string().trim(),
  size: z.enum(COMPANY_SIZES),
  status: z.enum(CompanyStatus),
  phone: z.string().trim().regex(PHONE, 'Enter a valid phone number').or(z.literal('')),
  location: z.string().trim(),
  owner: z.string().trim().min(1, 'Owner is required'),
  notes: z.string().trim(),
});
const buildSchema = (properties: readonly CustomPropertyDef[]) =>
  baseSchema.extend({ custom: customFieldsSchema(properties) });
type Schema = ReturnType<typeof buildSchema>;
type Values = z.infer<Schema>;

const toInitial = (row: CompanyRow | null, properties: readonly CustomPropertyDef[]): Values => ({
  name: row?.name ?? '',
  domain: row?.domain ?? '',
  industry: row?.industry ?? '',
  size: (row?.size as Values['size']) ?? COMPANY_SIZES[0],
  status: row?.status ?? CompanyStatus.Prospect,
  phone: row?.phone ?? '',
  location: row?.location ?? '',
  owner: row?.owner ?? '',
  notes: row?.notes ?? '',
  custom: customDefaults(properties, row?.custom),
});

interface CompanyFormProps {
  initial: CompanyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an account, with the company's own properties. */
export function CompanyForm(props: Readonly<CompanyFormProps>) {
  return (
    <CustomPropertiesGate object={CrmObject.Company}>
      {(properties) => <CompanyFormFields {...props} properties={properties} />}
    </CustomPropertiesGate>
  );
}

function CompanyFormFields({
  initial,
  onDone,
  onCancel,
  properties,
}: Readonly<CompanyFormProps & { properties: CustomPropertyDef[] }>) {
  const t = useT();
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const schema = useMemo(() => buildSchema(properties), [properties]);
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, properties),
  });
  const toInput = (values: Values) => ({
    ...values,
    custom: toCustomInput(properties, values.custom),
  });

  const sizeOptions: SelectOption[] = COMPANY_SIZES.map((size) => ({
    value: size,
    label: t('{size} people', { size }),
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Company',
    initial,
    create: (values: Values) => createCompany({ variables: { input: toInput(values) } }),
    update: (row, values) => updateCompany({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Company name" />
      <RhfTextField name="domain" label="Domain" helperText="e.g. exyconn.com" />
      <RhfTextField name="industry" label="Industry" />
      <RhfSelect name="size" label="Size" options={sizeOptions} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="owner" label="Owner" />
      <RhfTextField name="phone" label="Phone" />
      <RhfTextField name="location" label="Location" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
      <CustomFieldsSection properties={properties} />
    </EntityForm>
  );
}
