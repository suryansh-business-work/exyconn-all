import {
  CrmObjectSchemaDocument,
  CrmPropertiesDocument,
  CrmPropertyType,
  type CrmObject,
} from '@exyconn/shell/graphql/generated';

/** Each property type in plain language, in the order the type picker offers them. */
export const PROPERTY_TYPE_LABELS: Readonly<Record<CrmPropertyType, string>> = {
  [CrmPropertyType.Text]: 'Single-line text',
  [CrmPropertyType.Email]: 'Email',
  [CrmPropertyType.Phone]: 'Phone number',
  [CrmPropertyType.Url]: 'Website',
  [CrmPropertyType.Number]: 'Number',
  [CrmPropertyType.Date]: 'Date',
  [CrmPropertyType.Enum]: 'Dropdown select',
  [CrmPropertyType.Boolean]: 'Yes/No',
};

/** The permission module properties are restricted under in Admin > Roles & Permissions. */
export const PROPERTY_PERMISSION_MODULE = 'CrmProperty';

/**
 * The queries to re-read after a property changes, so the lists' columns and the record forms
 * pick it up along with this screen.
 */
export const propertyRefetches = (object: CrmObject) => [
  { query: CrmObjectSchemaDocument, variables: { object } },
  { query: CrmPropertiesDocument, variables: { object } },
];
