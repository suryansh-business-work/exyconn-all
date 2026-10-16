import { RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { ActivitySubject } from '@exyconn/shell/graphql/generated';
import {
  CreateCompanyPanel,
  CreateContactPanel,
  QuickCreateSelect,
} from '../../../../records/quick-create';

interface RelatedPickerProps {
  relatedType: ActivitySubject;
  options: SelectOption[];
  refetchContacts: () => Promise<unknown>;
  refetchCompanies: () => Promise<unknown>;
}

/**
 * What the activity is about. A contact or company can be created on the spot from the list;
 * a deal is picked from the deals that exist.
 */
export function RelatedPicker({
  relatedType,
  options,
  refetchContacts,
  refetchCompanies,
}: Readonly<RelatedPickerProps>) {
  if (relatedType === ActivitySubject.Contact) {
    return (
      <QuickCreateSelect
        name="relatedId"
        label="Related to"
        options={options}
        createLabel="Create Contact"
        onRefresh={refetchContacts}
        renderCreate={(done, cancel) => <CreateContactPanel done={done} cancel={cancel} />}
      />
    );
  }
  if (relatedType === ActivitySubject.Company) {
    return (
      <QuickCreateSelect
        name="relatedId"
        label="Related to"
        options={options}
        createLabel="Create Company"
        onRefresh={refetchCompanies}
        renderCreate={(done, cancel) => <CreateCompanyPanel done={done} cancel={cancel} />}
      />
    );
  }
  return <RhfSelect name="relatedId" label="Related to" options={options} />;
}
