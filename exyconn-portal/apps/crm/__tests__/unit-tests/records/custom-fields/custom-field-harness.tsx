import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import {
  CustomFieldsSection,
  customFieldsSchema,
  type CustomFormValues,
  type CustomPropertyDef,
} from '../../../../src/records/custom-fields';

interface HarnessProps {
  properties: CustomPropertyDef[];
  initial?: Partial<CustomFormValues>;
  onSubmit: (custom: CustomFormValues) => void;
}

/** A record form reduced to its custom properties, validated by their schema. */
export function CustomFieldsHarness({
  properties,
  initial = {},
  onSubmit,
}: Readonly<HarnessProps>) {
  const schema = z.object({ custom: customFieldsSchema(properties) });
  const form = useForm<{ custom: CustomFormValues }>({
    resolver: zodResolver(schema),
    defaultValues: { custom: initial },
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values.custom))} noValidate>
        <CustomFieldsSection properties={properties} />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

/** A custom property definition; optional Text by default. */
export function customDef(overrides: Partial<CustomPropertyDef> = {}): CustomPropertyDef {
  return {
    key: 'field',
    label: 'Field',
    type: CrmPropertyType.Text,
    options: [],
    required: false,
    description: '',
    ...overrides,
  };
}

export const OPTIONS = [
  { __typename: 'CrmPropertyOption' as const, value: 'A', label: 'Alpha' },
  { __typename: 'CrmPropertyOption' as const, value: 'B', label: 'Beta' },
  { __typename: 'CrmPropertyOption' as const, value: 'C', label: 'Gamma' },
];
