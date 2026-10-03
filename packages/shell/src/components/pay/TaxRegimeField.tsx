import { useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { RhfSelect, type SelectOption } from '@/components/form/rhf';
import { useTaxRegimeChoicesQuery } from '@/graphql/generated';
import { COMPANY_TAX_REGIME, NO_TAX_BRACKET, type CompensationValues } from './compensation';

/** What each choice does to the payslip, said under the field once it is picked. */
function hintFor(value: string): string {
  if (value === NO_TAX_BRACKET) {
    return 'No tax bracket: payroll withholds no TDS from this employee.';
  }
  if (value === COMPANY_TAX_REGIME) {
    return 'Taxed under the regime Payroll Settings names, whenever payroll withholds TDS.';
  }
  return "This regime's slabs set the TDS, whenever payroll withholds TDS.";
}

/**
 * Which income-tax regime this employee is taxed under — or none at all.
 *
 * The regimes are read from HR › Tax Slabs rather than written down here, so one added
 * there is offered here without a release. A regime that has since been deleted stays
 * selectable under its key, so opening an old record does not silently change its answer.
 */
export function TaxRegimeField() {
  const t = useT();
  const { watch } = useFormContext<CompensationValues>();
  const value = watch('taxRegime');
  const { data, error } = useTaxRegimeChoicesQuery({ fetchPolicy: 'cache-and-network' });
  const choices = data?.taxRegimeChoices ?? [];

  const regimes: SelectOption[] = choices.map((choice) => ({
    value: choice.regimeKey,
    label: choice.active ? choice.name : t('{name} (not applied)', { name: choice.name }),
  }));
  const isSentinel = value === COMPANY_TAX_REGIME || value === NO_TAX_BRACKET;
  // Only once the list has arrived: a failed or pending load proves nothing is missing.
  const missing = Boolean(data) && !isSentinel && !choices.some((c) => c.regimeKey === value);
  if (missing) {
    regimes.push({ value, label: t('{key} (no longer on file)', { key: value }) });
  }
  const options: SelectOption[] = [
    { value: COMPANY_TAX_REGIME, label: t('Company default') },
    ...regimes,
    { value: NO_TAX_BRACKET, label: t('No tax bracket') },
  ];

  let helperText = hintFor(value);
  if (error) {
    helperText = "The regimes couldn't be loaded. Company default and No tax bracket still work.";
  }

  return (
    <RhfSelect name="taxRegime" label="Tax regime" options={options} helperText={helperText} />
  );
}
