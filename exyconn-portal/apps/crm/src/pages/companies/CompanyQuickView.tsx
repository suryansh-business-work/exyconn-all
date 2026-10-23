import { Divider } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGetCompanyQuery, type CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { EditRecordButton } from '../../records/detail';
import { QuickViewDrawer, QuickViewPanel } from '../../records/quick-view';
import {
  ReachOutActions,
  composeEmailTo,
  emailsOf,
  phonesOf,
  type ReachOutRecord,
} from '../../records/comms';
import { GoogleMapCard } from '../../maps/GoogleMapCard';
import { CompanyForm } from './forms/company';
import { CompanyFields } from './detail/CompanyFields';
import { CompanyHeader } from './detail/CompanyHeader';

interface CompanyQuickViewProps {
  /** The company to show; empty keeps the panel closed. */
  id: string;
  onClose: () => void;
  /** Called after an edit is saved, so the list reloads its rows. */
  onSaved: () => void;
}

/** One company at a glance, beside the Companies list, with Full view and Edit at the top. */
export function CompanyQuickView({ id, onClose, onSaved }: Readonly<CompanyQuickViewProps>) {
  return (
    <QuickViewDrawer open={id !== ''} onClose={onClose} label="Company preview">
      {id && <CompanyQuickViewBody id={id} onClose={onClose} onSaved={onSaved} />}
    </QuickViewDrawer>
  );
}

function CompanyQuickViewBody({ id, onClose, onSaved }: Readonly<CompanyQuickViewProps>) {
  const { data, error, refetch } = useGetCompanyQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const company = data?.getCompany;
  const reload = () => {
    refetch().catch((reloadError: unknown) =>
      portalLogger.warn('crm: reloading the company preview failed', reloadError),
    );
  };
  return (
    <QuickViewPanel
      fullViewTo={`/companies/${id}`}
      onClose={onClose}
      error={error}
      onRetry={reload}
      loadingLabel="Loading the company"
      errorText="Could not load the company."
      edit={
        company && (
          <EditRecordButton
            textOnly
            label="Edit company"
            onSaved={() => {
              reload();
              onSaved();
            }}
            renderForm={(handlers) => <CompanyForm initial={company} {...handlers} />}
          />
        )
      }
    >
      {company && (
        <>
          <CompanyHeader company={company} titleComponent="h2" />
          <Divider />
          <CompanyFields
            company={company}
            onEmail={(address) => {
              onClose();
              composeEmailTo(reachOutOf(company), address);
            }}
          />
          <ReachOutActions record={reachOutOf(company)} onOpen={onClose} />
          <GoogleMapCard target={company} title={company.name} />
        </>
      )}
    </QuickViewPanel>
  );
}

/** The company as the communication dock takes it: every number and address on it. */
const reachOutOf = (company: CompanyFieldsFragment): ReachOutRecord => ({
  object: 'COMPANY',
  id: company.id,
  name: company.name,
  phones: phonesOf(company),
  emails: emailsOf(company),
});
