import { CrmObject, CrmObjectSchemaDocument } from '@exyconn/shell/graphql/generated';

/**
 * For component specs of the lead, company and contact forms: answers every CrmObjectSchema
 * query with no custom properties, so the form renders as it did before custom properties
 * existed. Only imported by `*.cy.tsx` files.
 */
export const noCustomPropertiesMock = {
  request: { query: CrmObjectSchemaDocument, variables: () => true },
  result: {
    data: {
      crmObjectSchema: {
        __typename: 'CrmObjectSchema',
        object: CrmObject.Lead,
        dedupeKey: 'email',
        properties: [],
      },
    },
  },
  maxUsageCount: 10,
};
