import { useMemo } from 'react';
import { timezoneOptions } from '@exyconn/i18n';
import { RhfAutocomplete, RhfCurrencyField, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { FormSection } from '@/components/form/FormSection';
import { MONTH_OPTIONS, TAX_SYSTEM_OPTIONS } from './organization.options';

/** The standards the company's portal runs in, and its registrations. */
export function OrganizationSettingsFields({ timezone }: Readonly<{ timezone: string }>) {
  const zones = useMemo(() => timezoneOptions(timezone), [timezone]);
  return (
    <FormSection
      title="Money, language & tax"
      hint="Every screen in the company reads these. Defaults are filled in; check them."
    >
      {/* This is where the company's currency is set, so it never defaults to one. */}
      <RhfCurrencyField
        defaultToCompany={false}
        helperText="Required. What this company keeps its books in."
      />
      <RhfTextField
        name="locale"
        label="Language"
        required
        helperText="A BCP 47 tag, such as en or de-DE."
      />
      <RhfAutocomplete
        name="timezone"
        label="Timezone"
        required
        options={zones}
        helperText="The clock it works by."
      />
      <RhfSelect
        name="fiscalYearStartMonth"
        label="Financial year starts"
        required
        options={MONTH_OPTIONS}
        helperText="January in much of the world, April in India."
      />
      <RhfSelect
        name="taxSystem"
        label="Tax rules"
        required
        options={TAX_SYSTEM_OPTIONS}
        helperText="What its invoices and payroll follow."
      />
      <RhfTextField
        name="registrationNumber"
        label="Registration number"
        helperText="Optional. CIN, Companies House number, EIN or similar."
      />
      <RhfTextField
        name="taxId"
        label="Tax number"
        helperText="Optional. GSTIN, VAT number or similar."
      />
    </FormSection>
  );
}
