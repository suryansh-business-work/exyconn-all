import { vi } from 'vitest';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { schemaProperty } from './settings-fixtures';

/** The built-in properties each record type comes with in these tests. */
const PROPERTIES = {
  [CrmObject.Lead]: [schemaProperty(), schemaProperty({ key: 'email', label: 'Email' })],
  [CrmObject.Company]: [schemaProperty()],
  [CrmObject.Contact]: [schemaProperty()],
};

/** A loaded `useCrmObjectSchemaQuery` result for one record type. */
const loaded = (object: CrmObject) => ({
  data: { crmObjectSchema: { object, dedupeKey: '', properties: PROPERTIES[object] } },
  loading: false,
  error: undefined,
  refetch: vi.fn(),
});

/** One stable result per record type, so memoised schemas do not change between renders. */
const RESULTS: Readonly<Record<CrmObject, ReturnType<typeof loaded>>> = {
  [CrmObject.Lead]: loaded(CrmObject.Lead),
  [CrmObject.Company]: loaded(CrmObject.Company),
  [CrmObject.Contact]: loaded(CrmObject.Contact),
};

export const schemaResult = (object: CrmObject) => RESULTS[object];
