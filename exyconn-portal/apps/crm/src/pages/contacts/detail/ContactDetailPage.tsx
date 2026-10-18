import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button } from '@exyconn/shell/components/ui';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineObject,
  useCrmGmailReadyQuery,
  useGetContactQuery,
} from '@exyconn/shell/graphql/generated';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import {
  DetailLayout,
  EmailThreads,
  RecordDetailSkeleton,
  Timeline,
} from '../../../records/detail';
import { ContactOverview } from './ContactOverview';
import { ContactProfile } from './ContactProfile';

/** A contact's own page: profile, overview and the full activity, at /contacts/:id/:tab. */
export function ContactDetailPage() {
  const t = useT();
  const { id = '' } = useParams();
  const { data, error, refetch } = useGetContactQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const contact = data?.getContact;
  const { data: gmail } = useCrmGmailReadyQuery();
  usePageTitle(contact?.name ?? t('Contact'));
  const reload = () => {
    refetch().catch((reloadError: unknown) =>
      portalLogger.warn('crm: reloading the contact failed', reloadError),
    );
  };

  if (error && !contact) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the contact.'))}
      </Alert>
    );
  }
  if (!contact) {
    return <RecordDetailSkeleton label="Loading the contact" />;
  }

  const tabs: TabberItem[] = [
    { slug: 'overview', label: 'Overview', content: <ContactOverview contact={contact} /> },
    {
      slug: 'activity',
      label: 'Activity',
      content: <Timeline object={CrmTimelineObject.Contact} id={contact.id} limit={200} />,
    },
    ...(gmail?.crmGmailReady
      ? [
          {
            slug: 'emails',
            label: 'Emails',
            content: (
              <EmailThreads
                object={CrmTimelineObject.Contact}
                id={contact.id}
                defaultTo={[contact.email].filter(Boolean)}
              />
            ),
          },
        ]
      : []),
  ];
  return (
    <Box>
      <DetailLayout aside={<ContactProfile contact={contact} onSaved={reload} />}>
        <Tabber basePath={`/contacts/${contact.id}`} items={tabs} ariaLabel="Contact" />
      </DetailLayout>
    </Box>
  );
}
