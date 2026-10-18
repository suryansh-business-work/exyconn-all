import { countryName, useFormatters, useI18n, useT } from '@exyconn/i18n';
import type { CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { ContactPointList, DetailField, DetailList, LocalTime } from '../../../records/detail';
import { EmailVerifyButton } from '../../../email-verification';

const verifyButton = (address: string) => <EmailVerifyButton email={address} />;

/** How to reach the company and its key facts, each with a placeholder when it is not known. */
export function CompanyFields({ company }: Readonly<{ company: CompanyFieldsFragment }>) {
  const t = useT();
  const { locale } = useI18n();
  const { formatCurrency, formatNumber } = useFormatters();
  const place = [company.city, company.country ? countryName(company.country, locale) : '']
    .filter(Boolean)
    .join(', ');
  return (
    <DetailList>
      <DetailField label="Email" empty="No email">
        {company.emails.length > 0 && (
          <ContactPointList
            scheme="mailto"
            points={company.emails.map((e) => ({ ...e, value: e.address }))}
            trailing={verifyButton}
          />
        )}
      </DetailField>
      <DetailField label="Phone" empty="No phone">
        {company.phones.length > 0 && (
          <ContactPointList
            scheme="tel"
            points={company.phones.map((p) => ({ ...p, value: p.number }))}
          />
        )}
      </DetailField>
      <DetailField label="Industry" empty="No industry">
        {company.industry}
      </DetailField>
      <DetailField label="Size" empty="No size">
        {company.size && t('{size} people', { size: company.size })}
      </DetailField>
      <DetailField label="Employees" empty="No employee count">
        {company.employeeCount == null ? '' : formatNumber(company.employeeCount)}
      </DetailField>
      <DetailField label="Annual revenue" empty="No annual revenue">
        {company.annualRevenue == null ? '' : formatCurrency(company.annualRevenue)}
      </DetailField>
      <DetailField label="Founded" empty="No founding year">
        {company.foundedYear == null ? '' : String(company.foundedYear)}
      </DetailField>
      <DetailField label="Location" empty="No location">
        {place || company.location}
      </DetailField>
      <DetailField label="Local time" empty="No time zone">
        {company.timezone && <LocalTime timezone={company.timezone} />}
      </DetailField>
    </DetailList>
  );
}
