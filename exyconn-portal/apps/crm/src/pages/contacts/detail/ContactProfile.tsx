import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { CrmTagObject, type ContactFieldsFragment } from '@exyconn/shell/graphql/generated';
import { DetailActions, EditRecordButton, TagsEditor } from '../../../records/detail';
import {
  ReachOutActions,
  composeEmailTo,
  emailsOf,
  phonesOf,
  type ReachOutRecord,
} from '../../../records/comms';
import { GoogleMapCard } from '../../../maps/GoogleMapCard';
import { ContactForm } from '../forms/contact';
import { ContactFields } from './ContactFields';
import { ContactHeader } from './ContactHeader';

/** The left column of a contact's page: who they are, how to reach them, and the actions. */
export function ContactProfile({
  contact,
  onSaved,
}: Readonly<{ contact: ContactFieldsFragment; onSaved: () => void }>) {
  const t = useT();
  const reachOut: ReachOutRecord = {
    object: 'CONTACT',
    id: contact.id,
    name: contact.name,
    phones: phonesOf(contact),
    emails: emailsOf(contact),
  };
  return (
    <Stack spacing={2}>
      <ContactHeader
        contact={contact}
        action={
          <EditRecordButton
            label="Edit contact"
            onSaved={onSaved}
            renderForm={(handlers) => <ContactForm initial={contact} {...handlers} />}
          />
        }
      />
      <DetailActions
        target={{ relatedType: 'CONTACT', relatedId: contact.id, relatedName: contact.name }}
      />
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Contact details')}
      </Text>
      <ContactFields contact={contact} onEmail={(address) => composeEmailTo(reachOut, address)} />
      <TagsEditor object={CrmTagObject.Contact} id={contact.id} tags={contact.tags} />
      <ReachOutActions record={reachOut} />
      <GoogleMapCard target={contact} title={contact.name} />
    </Stack>
  );
}
