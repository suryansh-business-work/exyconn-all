import {
  RhfChipsInput,
  RhfMultiSelect,
  RhfSwitch,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import {
  useListClientsQuery,
  useListCompaniesQuery,
  useListContactsQuery,
} from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';

/** "Name · address", or the name alone for a record without one. */
const optionLabel = (name: string, email?: string | null): string =>
  email ? `${name} · ${email}` : name;

/**
 * Records named by hand. They are added whatever the rules say — a client can be a company
 * or a person, so this is a source of records, not a kind of recipient — and they still pass
 * every unsubscribe and block check.
 */
export function AudienceDataSources() {
  const { data: clients } = useListClientsQuery();
  const { data: contacts } = useListContactsQuery();
  const { data: companies } = useListCompaniesQuery();
  const clientOptions: SelectOption[] = (clients?.listClients ?? []).map((row) => ({
    value: row.id,
    label: optionLabel(row.name, row.email),
  }));
  const contactOptions: SelectOption[] = (contacts?.listContacts ?? []).map((row) => ({
    value: row.id,
    label: optionLabel(row.name, row.email),
  }));
  const companyOptions: SelectOption[] = (companies?.listCompanies ?? []).map((row) => ({
    value: row.id,
    label: optionLabel(row.name, row.domain),
  }));
  return (
    <BuilderSection
      title="Data sources"
      hint="Records you pick here are always included, even when they do not match the filters. Compliance exclusions still apply."
    >
      <RhfMultiSelect
        name="contactIds"
        label="CRM contacts"
        options={contactOptions}
        helperText={contactOptions.length ? undefined : 'No contacts found — add contacts first.'}
      />
      <RhfMultiSelect
        name="companyIds"
        label="CRM companies"
        options={companyOptions}
        helperText={companyOptions.length ? undefined : 'No companies found — add companies first.'}
      />
      <RhfMultiSelect
        name="clientIds"
        label="Clients"
        options={clientOptions}
        helperText={clientOptions.length ? undefined : 'No clients found — add clients first.'}
      />
      <RhfSwitch name="allActiveClients" label="Include every active client" />
      <RhfChipsInput
        name="excludedEmails"
        label="Exclude these addresses"
        helperText="Press Enter after each address. They are never sent to from this audience."
      />
    </BuilderSection>
  );
}
