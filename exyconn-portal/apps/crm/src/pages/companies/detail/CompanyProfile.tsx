import { countryName, useFormatters, useI18n, useT } from '@exyconn/i18n';
import { Chip, Divider, Flex, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import {
  ContactPointList,
  DetailActions,
  DetailField,
  EmailButton,
  LocalTime,
  RecordAvatar,
} from '../../../records/detail';
import { GoogleMapCard } from '../../../maps/GoogleMapCard';
import { EmailVerifyButton } from '../../../email-verification';
import { CompanyForm } from '../forms/company';

const verifyButton = (address: string) => <EmailVerifyButton email={address} />;

/** The left column of a company's page: the account, how to reach it, and the actions. */
export function CompanyProfile({
  company,
  onSaved,
}: Readonly<{ company: CompanyFieldsFragment; onSaved: () => void }>) {
  const t = useT();
  const { locale } = useI18n();
  const { formatCurrency, formatNumber } = useFormatters();
  const place = [company.city, company.country ? countryName(company.country, locale) : '']
    .filter(Boolean)
    .join(', ');
  return (
    <Stack spacing={2}>
      <Flex direction="row" spacing={1.5} alignItems="center">
        <RecordAvatar
          name={company.name}
          src={company.logoUrl}
          variant="rounded"
          sx={{ width: 56, height: 56 }}
        />
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Text component="h1" size="lg" weight="bold">
            {company.name}
          </Text>
          <Link href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer">
            {company.domain}
          </Link>
          <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={t(company.status)} />
            {company.isClient && <Chip size="small" color="success" label={t('Client')} />}
          </Flex>
        </Stack>
      </Flex>
      <DetailActions
        target={{ relatedType: 'COMPANY', relatedId: company.id, relatedName: company.name }}
        extra={
          <EmailButton
            context={{ object: 'COMPANY', id: company.id, to: [company.email].filter(Boolean) }}
          />
        }
        renderEdit={(close) => (
          <CompanyForm
            initial={company}
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
        {t('Company details')}
      </Text>
      <DetailField label="Email">
        {company.emails.length > 0 && (
          <ContactPointList
            scheme="mailto"
            points={company.emails.map((e) => ({ ...e, value: e.address }))}
            trailing={verifyButton}
          />
        )}
      </DetailField>
      <DetailField label="Phone">
        {company.phones.length > 0 && (
          <ContactPointList
            scheme="tel"
            points={company.phones.map((p) => ({ ...p, value: p.number }))}
          />
        )}
      </DetailField>
      <DetailField label="Industry">{company.industry}</DetailField>
      <DetailField label="Size">{t('{size} people', { size: company.size })}</DetailField>
      <DetailField label="Employees">
        {company.employeeCount == null ? '' : formatNumber(company.employeeCount)}
      </DetailField>
      <DetailField label="Annual revenue">
        {company.annualRevenue == null ? '' : formatCurrency(company.annualRevenue)}
      </DetailField>
      <DetailField label="Founded">
        {company.foundedYear == null ? '' : String(company.foundedYear)}
      </DetailField>
      <DetailField label="Location">{place || company.location}</DetailField>
      <DetailField label="Local time">
        {company.timezone && <LocalTime timezone={company.timezone} />}
      </DetailField>
      <GoogleMapCard target={company} title={company.name} />
    </Stack>
  );
}
