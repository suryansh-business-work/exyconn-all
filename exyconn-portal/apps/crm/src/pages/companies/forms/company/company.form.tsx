import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CrmObject,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from '@exyconn/shell/graphql/generated';
import {
  CustomFieldsSection,
  CustomPropertiesGate,
  type CustomPropertyDef,
} from '../../../../records/custom-fields';
import { CompanyDetailsFields } from './company-details.fields';
import {
  buildCompanySchema,
  toCompanyInput,
  toCompanyValues,
  type CompanySchema,
  type CompanyValues,
} from './company.schema';
import type { CompanyRow } from './company.types';

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
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const schema = useMemo(() => buildCompanySchema(properties), [properties]);
  const methods = useForm<z.input<CompanySchema>, unknown, CompanyValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toCompanyValues(initial, properties),
  });
  const toInput = (values: CompanyValues) => toCompanyInput(values, properties);

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Company',
    initial,
    create: (values: CompanyValues) => createCompany({ variables: { input: toInput(values) } }),
    update: (row, values) => updateCompany({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <CompanyDetailsFields />
      <CustomFieldsSection properties={properties} />
    </EntityForm>
  );
}
