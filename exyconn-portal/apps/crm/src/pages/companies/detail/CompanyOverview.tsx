import { useFormatters, useT } from '@exyconn/i18n';
import { Divider, Link, Stack, Text } from '@exyconn/shell/components/ui';
import {
  CrmObject,
  CrmTimelineObject,
  type CompanyFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { CustomValues, DetailField, Timeline } from '../../../records/detail';

/** The Overview tab: what we know about the account, then its latest touchpoints. */
export function CompanyOverview({ company }: Readonly<{ company: CompanyFieldsFragment }>) {
  const t = useT();
  const { formatDate } = useFormatters();
  const external = (url: string) =>
    url && (
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </Link>
    );
  return (
    <Stack spacing={2}>
      <Text component="h2" size="label" weight="bold">
        {t('Company overview')}
      </Text>
      <DetailField label="About">{company.description}</DetailField>
      <DetailField label="Website">{external(company.website)}</DetailField>
      <DetailField label="LinkedIn">{external(company.linkedinUrl)}</DetailField>
      <DetailField label="X (Twitter)">{external(company.twitterUrl)}</DetailField>
      <DetailField label="Address">{company.address}</DetailField>
      <DetailField label="Company owner">{company.owner}</DetailField>
      <DetailField label="Added">{formatDate(company.createdAt)}</DetailField>
      <CustomValues
        object={CrmObject.Company}
        values={(company.custom ?? {}) as Record<string, unknown>}
      />
      <DetailField label="Notes">{company.notes}</DetailField>
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Recent activity')}
      </Text>
      <Timeline object={CrmTimelineObject.Company} id={company.id} limit={5} filters={false} />
    </Stack>
  );
}
