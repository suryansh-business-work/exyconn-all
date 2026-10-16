import { useMemo } from 'react';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { useObjectSchema, type CrmPropertyInfo } from '../../../../records/schema';
import type { TakenKeys } from './crm-property.types';

const keysOf = (properties: readonly CrmPropertyInfo[]): ReadonlySet<string> =>
  new Set(properties.map((property) => property.key));

/**
 * Every key each record type already uses, built in or added, so a new property is told about a
 * clash on any type it is being added to before the save. The schemas are the ones the record
 * lists already load, so this is usually served from the cache.
 */
export function useTakenKeys(): TakenKeys {
  const leads = useObjectSchema(CrmObject.Lead).properties;
  const companies = useObjectSchema(CrmObject.Company).properties;
  const contacts = useObjectSchema(CrmObject.Contact).properties;
  return useMemo(
    () => ({
      [CrmObject.Lead]: keysOf(leads),
      [CrmObject.Company]: keysOf(companies),
      [CrmObject.Contact]: keysOf(contacts),
    }),
    [leads, companies, contacts],
  );
}
