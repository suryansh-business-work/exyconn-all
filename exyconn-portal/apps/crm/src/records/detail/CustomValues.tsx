import { useT } from '@exyconn/i18n';
import {
  useCrmObjectSchemaQuery,
  type CrmObject,
  type CrmPropertyInfoFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { DetailField } from './DetailField';

type Property = CrmPropertyInfoFieldsFragment;

/** A choice's label rather than the value records store. */
const labelOf = (property: Property, value: unknown) =>
  property.options.find((option) => option.value === value)?.label ?? String(value);

/** A stored value as a person reads it; '' when there is none. */
function shown(property: Property, value: unknown, yes: string, no: string): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? yes : no;
  }
  if (Array.isArray(value)) {
    return value.map((item) => labelOf(property, item)).join(', ');
  }
  return labelOf(property, value);
}

/** The company's own properties on this record, under their labels, in their order. */
export function CustomValues({
  object,
  values,
}: Readonly<{ object: CrmObject; values: Record<string, unknown> }>) {
  const t = useT();
  const { data } = useCrmObjectSchemaQuery({ variables: { object } });
  const custom = (data?.crmObjectSchema.properties ?? []).filter((property) => !property.builtIn);
  return (
    <>
      {custom.map((property) => (
        <DetailField key={property.key} label={property.label}>
          {shown(property, values[property.key], t('Yes'), t('No'))}
        </DetailField>
      ))}
    </>
  );
}
