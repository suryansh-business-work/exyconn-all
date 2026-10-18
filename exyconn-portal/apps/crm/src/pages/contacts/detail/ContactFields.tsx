import { countryName, useI18n } from '@exyconn/i18n';
import type { ContactFieldsFragment } from '@exyconn/shell/graphql/generated';
import {
  ContactPointList,
  DetailField,
  DetailList,
  LocalTime,
  TruncatedLink,
} from '../../../records/detail';
import { EmailVerifyButton } from '../../../email-verification';

const verifyButton = (address: string) => <EmailVerifyButton email={address} />;

/** How to reach the person and where they are, each with a placeholder when it is not known. */
export function ContactFields({ contact }: Readonly<{ contact: ContactFieldsFragment }>) {
  const { locale } = useI18n();
  const place = [contact.city, contact.country ? countryName(contact.country, locale) : '']
    .filter(Boolean)
    .join(', ');
  return (
    <DetailList>
      <DetailField label="Email" empty="No email">
        {contact.emails.length > 0 && (
          <ContactPointList
            scheme="mailto"
            points={contact.emails.map((e) => ({ ...e, value: e.address }))}
            trailing={verifyButton}
          />
        )}
      </DetailField>
      <DetailField label="Phone" empty="No phone">
        {contact.phones.length > 0 && (
          <ContactPointList
            scheme="tel"
            points={contact.phones.map((p) => ({ ...p, value: p.number }))}
          />
        )}
      </DetailField>
      <DetailField label="Job title" empty="No job title">
        {contact.title}
      </DetailField>
      <DetailField label="Location" empty="No location">
        {place}
      </DetailField>
      <DetailField label="Local time" empty="No time zone">
        {contact.timezone && <LocalTime timezone={contact.timezone} />}
      </DetailField>
      <DetailField label="Languages" empty="No languages">
        {contact.languages.join(', ')}
      </DetailField>
      <DetailField label="LinkedIn" empty="No LinkedIn profile">
        {contact.linkedinUrl && (
          <TruncatedLink href={contact.linkedinUrl} text={contact.linkedinUrl} />
        )}
      </DetailField>
      <DetailField label="X (Twitter)" empty="No X account">
        {contact.twitterUrl && (
          <TruncatedLink href={contact.twitterUrl} text={contact.twitterUrl} />
        )}
      </DetailField>
    </DetailList>
  );
}
