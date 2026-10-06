import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useCountryOptions } from '@exyconn/shell/components/localization';
import { ClientSection } from './client-section';

/** Where the client is established — the country decides which tax numbers apply. */
export function ClientLocationFields() {
  const countries = useCountryOptions();
  return (
    <ClientSection title="Location">
      <RhfAutocomplete
        name="country"
        label="Country"
        options={countries}
        helperText="Where the client is established"
      />
      <RhfTextField name="region" label="State, province or region" />
      <RhfTextField name="city" label="City" />
      <RhfTextField name="postalCode" label="Postal code" />
      <RhfTextField name="billingAddress" label="Billing address" multiline minRows={2} />
    </ClientSection>
  );
}
