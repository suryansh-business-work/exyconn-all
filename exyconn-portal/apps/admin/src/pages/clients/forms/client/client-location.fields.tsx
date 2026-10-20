import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useCountryOptions } from '@exyconn/shell/components/localization';
import { ClientSection } from './client-section';

/** Where the client is established — the country decides which tax numbers apply. */
export function ClientLocationFields() {
  const countries = useCountryOptions();
  return (
    <ClientSection
      title="Location"
      hint="Optional, but the country decides which tax numbers apply."
    >
      <RhfAutocomplete
        name="country"
        label="Country"
        options={countries}
        helperText="Where the client is established."
      />
      <RhfTextField
        name="region"
        label="State, province or region"
        helperText="Optional. Up to 120 characters."
      />
      <RhfTextField name="city" label="City" helperText="Optional. Up to 120 characters." />
      <RhfTextField
        name="postalCode"
        label="Postal code"
        helperText="Optional. PIN, ZIP or postcode."
      />
      <RhfTextField
        name="billingAddress"
        label="Billing address"
        multiline
        minRows={2}
        data-wide
        helperText="Optional. Printed on invoices exactly as written."
      />
    </ClientSection>
  );
}
