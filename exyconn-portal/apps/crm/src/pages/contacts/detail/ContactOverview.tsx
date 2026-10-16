import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { Divider, Link, Stack, Text } from '@exyconn/shell/components/ui';
import {
  CrmObject,
  CrmTimelineObject,
  type ContactFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { CustomValues, DetailField, Timeline } from '../../../records/detail';

/** The Overview tab: what we know about the person, then their latest touchpoints. */
export function ContactOverview({ contact }: Readonly<{ contact: ContactFieldsFragment }>) {
  const t = useT();
  const { formatDate } = useFormatters();
  return (
    <Stack spacing={2}>
      <Text component="h2" size="label" weight="bold">
        {t('Profile overview')}
      </Text>
      <DetailField label="About">{contact.description}</DetailField>
      <DetailField label="Source">{contact.leadSource}</DetailField>
      <DetailField label="Associated company">
        {contact.companyId && (
          <Link component={RouterLink} to={`/crm/companies/${contact.companyId}`}>
            {contact.companyName}
          </Link>
        )}
      </DetailField>
      <DetailField label="Department">{contact.department}</DetailField>
      <DetailField label="Website">
        {contact.website && (
          <Link href={contact.website} target="_blank" rel="noopener noreferrer">
            {contact.website}
          </Link>
        )}
      </DetailField>
      <DetailField label="Contact owner">{contact.owner}</DetailField>
      <DetailField label="Added">{formatDate(contact.createdAt)}</DetailField>
      <CustomValues
        object={CrmObject.Contact}
        values={(contact.custom ?? {}) as Record<string, unknown>}
      />
      <DetailField label="Notes">{contact.notes}</DetailField>
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Recent activity')}
      </Text>
      <Timeline object={CrmTimelineObject.Contact} id={contact.id} limit={5} filters={false} />
    </Stack>
  );
}
