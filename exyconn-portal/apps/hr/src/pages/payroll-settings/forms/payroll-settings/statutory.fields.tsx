import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';

/** Provident fund, employee state insurance and professional tax: the payroll-settings rows. */
export function StatutoryFields() {
  return (
    <>
      <RhfSwitch name="pfEnabled" label="Withhold provident fund (PF)" />
      <RhfTextField
        name="pfEmployeePercent"
        label="PF rate (% of basic)"
        type="number"
        helperText="The employee's share withheld from basic pay each month, e.g. 12."
      />
      <RhfTextField
        name="pfWageCeiling"
        label="PF wage ceiling"
        type="number"
        helperText="PF is charged on basic only up to this figure; anything above it is exempt."
      />
      <RhfSwitch name="esiEnabled" label="Withhold employee state insurance (ESI)" />
      <RhfTextField
        name="esiEmployeePercent"
        label="ESI rate (% of gross)"
        type="number"
        helperText="The employee's share withheld from gross pay each month, e.g. 0.75."
      />
      <RhfTextField
        name="esiWageLimit"
        label="ESI wage limit"
        type="number"
        helperText="ESI applies only while gross is at or below this figure."
      />
      <RhfTextField
        name="professionalTaxMonthly"
        label="Professional tax per month"
        type="number"
        helperText="A flat amount. Set it to 0 in a state that does not levy it."
      />
    </>
  );
}
