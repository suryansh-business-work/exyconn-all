import { useFormatters, useT } from '@exyconn/i18n';
import { Divider, Link, Stack, Text } from '@exyconn/shell/components/ui';
import {
  CrmObject,
  CrmTimelineObject,
  type CompanyFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import {
  AiSummary,
  CustomValues,
  DetailField,
  DetailList,
  Timeline,
} from '../../../records/detail';

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
      <AiSummary object={CrmTimelineObject.Company} id={company.id} name={company.name} />
      <Text component="h2" size="label" weight="bold">
        {t('Company overview')}
      </Text>
      <DetailList>
        <DetailField label="About" empty="No description">
          {company.description}
        </DetailField>
        <DetailField label="Website" empty="No website">
          {external(company.website)}
        </DetailField>
        <DetailField label="LinkedIn" empty="No LinkedIn page">
          {external(company.linkedinUrl)}
        </DetailField>
        <DetailField label="X (Twitter)" empty="No X account">
          {external(company.twitterUrl)}
        </DetailField>
        <DetailField label="Address" empty="No address">
          {company.address}
        </DetailField>
        <DetailField label="Company owner" empty="No owner">
          {company.owner}
        </DetailField>
        <DetailField label="Added">{formatDate(company.createdAt)}</DetailField>
        <CustomValues
          object={CrmObject.Company}
          values={(company.custom ?? {}) as Record<string, unknown>}
        />
        <DetailField label="Notes" empty="No notes">
          {company.notes}
        </DetailField>
      </DetailList>
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Recent activity')}
      </Text>
      <Timeline object={CrmTimelineObject.Company} id={company.id} limit={5} filters={false} />
    </Stack>
  );
}
