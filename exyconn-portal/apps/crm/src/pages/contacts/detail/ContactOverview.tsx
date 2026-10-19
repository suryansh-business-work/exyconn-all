import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { Divider, Link, Stack, Text } from '@exyconn/shell/components/ui';
import {
  CrmObject,
  CrmTimelineObject,
  type ContactFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import {
  AiSummary,
  CustomValues,
  DetailField,
  DetailList,
  LeadOwnerField,
  Timeline,
} from '../../../records/detail';
import { RecordColdEmails } from '../../../records/cold-email';

/** The Overview tab: what we know about the person, then their latest touchpoints. */
export function ContactOverview({ contact }: Readonly<{ contact: ContactFieldsFragment }>) {
  const t = useT();
  const { formatDate } = useFormatters();
  return (
    <Stack spacing={2}>
      <AiSummary object={CrmTimelineObject.Contact} id={contact.id} name={contact.name} />
      <Text component="h2" size="label" weight="bold">
        {t('Profile overview')}
      </Text>
      <DetailList>
        <DetailField label="About" empty="No description">
          {contact.description}
        </DetailField>
        <DetailField label="Source" empty="No source">
          {contact.leadSource}
        </DetailField>
        <DetailField label="Associated company" empty="No company">
          {contact.companyId && (
            <Link component={RouterLink} to={`/companies/${contact.companyId}`}>
              {contact.companyName}
            </Link>
          )}
        </DetailField>
        <DetailField label="Department" empty="No department">
          {contact.department}
        </DetailField>
        <DetailField label="Website" empty="No website">
          {contact.website && (
            <Link href={contact.website} target="_blank" rel="noopener noreferrer">
              {contact.website}
            </Link>
          )}
        </DetailField>
        <DetailField label="Contact owner" empty="No owner">
          {contact.owner}
        </DetailField>
        <LeadOwnerField origin={contact.origin} />
        <DetailField label="Added">{formatDate(contact.createdAt)}</DetailField>
        <CustomValues
          object={CrmObject.Contact}
          values={(contact.custom ?? {}) as Record<string, unknown>}
        />
        <DetailField label="Notes" empty="No notes">
          {contact.notes}
        </DetailField>
      </DetailList>
      <RecordColdEmails id={contact.id} />
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Recent activity')}
      </Text>
      <Timeline object={CrmTimelineObject.Contact} id={contact.id} limit={5} filters={false} />
    </Stack>
  );
}
