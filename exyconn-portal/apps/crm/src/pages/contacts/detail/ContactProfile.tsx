import { countryName, useI18n, useT } from '@exyconn/i18n';
import { Avatar, Chip, Divider, Flex, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { ContactFieldsFragment } from '@exyconn/shell/graphql/generated';
import {
  ContactPointList,
  DetailActions,
  DetailField,
  EmailButton,
  LocalTime,
  initialsOf,
} from '../../../records/detail';
import { ContactForm } from '../forms/contact';

/** The left column of a contact's page: who they are, how to reach them, and the actions. */
export function ContactProfile({
  contact,
  onSaved,
}: Readonly<{ contact: ContactFieldsFragment; onSaved: () => void }>) {
  const t = useT();
  const { locale } = useI18n();
  const place = [contact.city, contact.country ? countryName(contact.country, locale) : '']
    .filter(Boolean)
    .join(', ');
  const role = [contact.title, contact.companyName].filter(Boolean).join(' · ');
  return (
    <Stack spacing={2}>
      <Flex direction="row" spacing={1.5} alignItems="center">
        <Avatar alt="" sx={{ width: 56, height: 56 }}>
          {initialsOf(contact.name)}
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Text component="h1" size="lg" weight="bold">
            {contact.name}
          </Text>
          {role && <Text color="text.secondary">{role}</Text>}
          <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={t(contact.lifecycleStage)} />
            <Chip size="small" variant="outlined" label={t(contact.status)} />
          </Flex>
        </Stack>
      </Flex>
      <DetailActions
        target={{ relatedType: 'CONTACT', relatedId: contact.id, relatedName: contact.name }}
        extra={
          <EmailButton
            context={{ object: 'CONTACT', id: contact.id, to: [contact.email].filter(Boolean) }}
          />
        }
        renderEdit={(close) => (
          <ContactForm
            initial={contact}
            onCancel={close}
            onDone={() => {
              close();
              onSaved();
            }}
          />
        )}
      />
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Contact details')}
      </Text>
      <DetailField label="Email">
        {contact.emails.length > 0 && (
          <ContactPointList
            scheme="mailto"
            points={contact.emails.map((e) => ({ ...e, value: e.address }))}
          />
        )}
      </DetailField>
      <DetailField label="Phone">
        {contact.phones.length > 0 && (
          <ContactPointList
            scheme="tel"
            points={contact.phones.map((p) => ({ ...p, value: p.number }))}
          />
        )}
      </DetailField>
      <DetailField label="Location">{place}</DetailField>
      <DetailField label="Local time">
        {contact.timezone && <LocalTime timezone={contact.timezone} />}
      </DetailField>
      <DetailField label="Languages">{contact.languages.join(', ')}</DetailField>
      <DetailField label="LinkedIn">
        {contact.linkedinUrl && (
          <Link href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
            {contact.linkedinUrl}
          </Link>
        )}
      </DetailField>
      <DetailField label="X (Twitter)">
        {contact.twitterUrl && (
          <Link href={contact.twitterUrl} target="_blank" rel="noopener noreferrer">
            {contact.twitterUrl}
          </Link>
        )}
      </DetailField>
    </Stack>
  );
}
