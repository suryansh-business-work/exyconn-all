import { RhfAutocomplete, RhfTextField, type SelectOption } from '@/components/form/rhf';
import { useCountryOptions } from '@/components/localization';

/** The empty country: the person follows the company's own. */
const COMPANY_COUNTRY_OPTION: SelectOption = { value: '', label: "Company's country" };

/**
 * Where the employee works — country, state or region, and city. Together they decide which
 * leave quotas apply and which holidays reach them, so HR sets them, not the employee.
 */
export function PlaceOfEmploymentFields() {
  const countries = useCountryOptions();
  return (
    <>
      <RhfAutocomplete
        name="country"
        label="Country of employment"
        options={[COMPANY_COUNTRY_OPTION, ...countries]}
        helperText="Decides which leave quotas and holidays apply to them."
      />
      <RhfTextField
        name="region"
        label="State / region of employment"
        helperText="Adds the holidays HR set for this state or region, e.g. Maharashtra."
      />
      <RhfTextField
        name="city"
        label="City of employment"
        helperText="Adds the holidays HR set for this city, e.g. Pune."
      />
    </>
  );
}
