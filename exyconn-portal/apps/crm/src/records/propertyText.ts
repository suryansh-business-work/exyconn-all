import type { useT } from '@exyconn/i18n';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from './schema';

/** How CRM record screens name a property and its type: shared by import, filters, sort, columns, export. */
export type Translate = ReturnType<typeof useT>;

/**
 * A property's label as a person reads it: built-in labels are the portal's English copy and
 * go through the catalogue; a custom property's label is what the company typed, shown as is.
 */
export function propertyLabel(t: Translate, property: CrmPropertyInfo): string {
  return property.builtIn ? t(property.label) : property.label;
}

/** What kind of value a property holds, as the property pickers name it (translate with `t`). */
export const PROPERTY_TYPE_LABEL: Readonly<Record<CrmPropertyType, string>> = {
  [CrmPropertyType.Text]: 'Text',
  [CrmPropertyType.Email]: 'Email',
  [CrmPropertyType.Phone]: 'Phone',
  [CrmPropertyType.Url]: 'URL',
  [CrmPropertyType.Number]: 'Number',
  [CrmPropertyType.Date]: 'Date',
  [CrmPropertyType.Enum]: 'Dropdown',
  [CrmPropertyType.Boolean]: 'Yes/No',
};
