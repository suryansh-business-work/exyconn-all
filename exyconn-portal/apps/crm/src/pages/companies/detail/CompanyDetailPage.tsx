import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineObject,
  useCrmGmailReadyQuery,
  useGetCompanyQuery,
} from '@exyconn/shell/graphql/generated';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import {
  ConnectMailboxLink,
  DetailLayout,
  EmailThreads,
  RecordDetailSkeleton,
  Timeline,
} from '../../../records/detail';
import { CompanyOverview } from './CompanyOverview';
import { CompanyPeople } from './CompanyPeople';
import { CompanyProfile } from './CompanyProfile';
import { GoogleBusinessTab } from './google-business/GoogleBusinessTab';

/** A company's own page: profile, overview, its people and every touchpoint, at /companies/:id/:tab. */
export function CompanyDetailPage() {
  const t = useT();
  const { id = '' } = useParams();
  const { data, error, refetch } = useGetCompanyQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const company = data?.getCompany;
  const { data: gmail } = useCrmGmailReadyQuery();
  usePageTitle(company?.name ?? t('Company'));
  const reload = () => {
    refetch().catch((reloadError: unknown) =>
      portalLogger.warn('crm: reloading the company failed', reloadError),
    );
  };

  if (error && !company) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the company.'))}
      </Alert>
    );
  }
  if (!company) {
    return <RecordDetailSkeleton label="Loading the company" />;
  }

  const tabs: TabberItem[] = [
    { slug: 'overview', label: 'Overview', content: <CompanyOverview company={company} /> },
    {
      slug: 'activity',
      label: 'Activity',
      content: <Timeline object={CrmTimelineObject.Company} id={company.id} limit={200} />,
    },
    { slug: 'people', label: 'People', content: <CompanyPeople companyId={company.id} /> },
    ...(company.placeId
      ? [
          {
            slug: 'google-business',
            label: 'Google Business',
            content: <GoogleBusinessTab companyId={company.id} />,
          },
        ]
      : []),
    ...(gmail?.crmGmailReady
      ? [
          {
            slug: 'emails',
            label: 'Emails',
            content: (
              <EmailThreads
                object={CrmTimelineObject.Company}
                id={company.id}
                defaultTo={[company.email].filter(Boolean)}
              />
            ),
          },
        ]
      : []),
  ];
  return (
    <DetailLayout aside={<CompanyProfile company={company} onSaved={reload} />}>
      <ConnectMailboxLink />
      <Tabber basePath={`/companies/${company.id}`} items={tabs} ariaLabel="Company" />
    </DetailLayout>
  );
}
