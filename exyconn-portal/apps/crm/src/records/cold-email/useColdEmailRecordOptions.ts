import { useDebouncedValue } from '@exyconn/shell/hooks/useDebouncedValue';
import {
  useListCompaniesPagedQuery,
  useListContactsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { emailsOf } from '../comms';
import type { ColdEmailDraftTarget } from './forms/cold-email-draft';

/** A record the cold email can be drafted for, with a line saying which one it is. */
export interface ColdEmailRecordOption extends ColdEmailDraftTarget {
  detail: string;
}

export type ColdEmailObject = ColdEmailDraftTarget['object'];

/** How long typing must pause before the CRM is searched. */
const SEARCH_DELAY_MS = 300;
/** The matches offered at once; typing more narrows them. */
const PAGE_SIZE = 20;

/** The contacts or companies matching what was typed, searched on the server. */
export function useColdEmailRecordOptions(object: ColdEmailObject, typed: string) {
  const search = useDebouncedValue(typed.trim(), SEARCH_DELAY_MS);
  const variables = { input: { page: 0, pageSize: PAGE_SIZE, search } };
  const contacts = useListContactsPagedQuery({ variables, skip: object !== 'CONTACT' });
  const companies = useListCompaniesPagedQuery({ variables, skip: object !== 'COMPANY' });

  const contactOptions: ColdEmailRecordOption[] = (contacts.data?.listContactsPaged.rows ?? []).map(
    (row) => ({
      object: 'CONTACT',
      id: row.id,
      name: row.name,
      emails: emailsOf(row),
      website: row.website,
      detail: [row.title, row.companyName].filter(Boolean).join(', '),
    }),
  );
  const companyOptions: ColdEmailRecordOption[] = (
    companies.data?.listCompaniesPaged.rows ?? []
  ).map((row) => ({
    object: 'COMPANY',
    id: row.id,
    name: row.name,
    emails: emailsOf(row),
    website: row.website || row.domain,
    detail: row.domain,
  }));

  const active = object === 'CONTACT' ? contacts : companies;
  return {
    options: object === 'CONTACT' ? contactOptions : companyOptions,
    loading: active.loading,
    error: active.error,
  };
}
