import { useMemo } from 'react';
import { countryOptions, useI18n } from '@exyconn/i18n';
import { RhfAutocomplete, RhfTextField } from '@/components/form/rhf';
import { FormSection } from '@/components/form/FormSection';

/** How to reach the company, and where it is. All optional. */
export function OrganizationContactFields() {
  const { locale } = useI18n();
  const countries = useMemo(
    () => countryOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );
  return (
    <FormSection
      title="Contact & address"
      hint="Optional. Fill in what you know; it can be completed later."
    >
      <RhfTextField
        name="contactEmail"
        label="Contact email"
        type="email"
        placeholder="admin@company.com"
        helperText="Where the platform team writes to the company."
      />
      <RhfTextField
        name="phone"
        label="Phone"
        placeholder="+91 98765 43210"
        helperText="Include the country code."
      />
      <RhfTextField
        name="website"
        label="Website"
        placeholder="https://"
        helperText="A full link starting with https://."
      />
      <RhfAutocomplete
        name="country"
        label="Country"
        options={countries}
        helperText="Where it operates; sets the tax numbers its forms ask for."
      />
      <RhfTextField name="addressLine1" label="Address line 1" helperText="Building and street." />
      <RhfTextField
        name="addressLine2"
        label="Address line 2"
        helperText="Area, landmark or suite."
      />
      <RhfTextField name="city" label="City" helperText="Town or city." />
      <RhfTextField name="region" label="State or region" helperText="State, province or county." />
      <RhfTextField name="postalCode" label="Postal code" helperText="PIN, ZIP or postcode." />
    </FormSection>
  );
}
