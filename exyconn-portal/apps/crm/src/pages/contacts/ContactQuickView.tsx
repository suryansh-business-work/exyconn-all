import { Divider } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGetContactQuery } from '@exyconn/shell/graphql/generated';
import { EditRecordButton } from '../../records/detail';
import { QuickViewDrawer, QuickViewPanel } from '../../records/quick-view';
import { ReachOutActions, emailsOf, phonesOf } from '../../records/comms';
import { GoogleMapCard } from '../../maps/GoogleMapCard';
import { ContactForm } from './forms/contact';
import { ContactFields } from './detail/ContactFields';
import { ContactHeader } from './detail/ContactHeader';

interface ContactQuickViewProps {
  /** The contact to show; empty keeps the panel closed. */
  id: string;
  onClose: () => void;
  /** Called after an edit is saved, so the list reloads its rows. */
  onSaved: () => void;
}

/** One contact at a glance, beside the Contacts list, with Full view and Edit at the top. */
export function ContactQuickView({ id, onClose, onSaved }: Readonly<ContactQuickViewProps>) {
  return (
    <QuickViewDrawer open={id !== ''} onClose={onClose} label="Contact preview">
      {id && <ContactQuickViewBody id={id} onClose={onClose} onSaved={onSaved} />}
    </QuickViewDrawer>
  );
}

function ContactQuickViewBody({ id, onClose, onSaved }: Readonly<ContactQuickViewProps>) {
  const { data, error, refetch } = useGetContactQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const contact = data?.getContact;
  const reload = () => {
    refetch().catch((reloadError: unknown) =>
      portalLogger.warn('crm: reloading the contact preview failed', reloadError),
    );
  };
  return (
    <QuickViewPanel
      fullViewTo={`/crm/contacts/${id}`}
      onClose={onClose}
      error={error}
      onRetry={reload}
      loadingLabel="Loading the contact"
      errorText="Could not load the contact."
      edit={
        contact && (
          <EditRecordButton
            label="Edit contact"
            onSaved={() => {
              reload();
              onSaved();
            }}
            renderForm={(handlers) => <ContactForm initial={contact} {...handlers} />}
          />
        )
      }
    >
      {contact && (
        <>
          <ContactHeader contact={contact} titleComponent="h2" />
          <Divider />
          <ContactFields contact={contact} />
          <ReachOutActions
            record={{
              object: 'CONTACT',
              id: contact.id,
              name: contact.name,
              phones: phonesOf(contact),
              emails: emailsOf(contact),
            }}
            onOpen={onClose}
          />
          <GoogleMapCard target={contact} title={contact.name} />
        </>
      )}
    </QuickViewPanel>
  );
}
