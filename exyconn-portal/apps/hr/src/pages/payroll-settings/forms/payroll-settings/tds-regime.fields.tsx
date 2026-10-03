import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { useTaxRegimeChoicesQuery } from '@exyconn/shell/graphql/generated';

/**
 * Which regime a SLAB run applies, and when the financial year it is read for opens.
 *
 * The regimes and their bands are edited on HR › Tax Slabs; this only chooses between the
 * ones on file. The list is read rather than written down here, so a regime added there is
 * offered here without a release.
 */
export function TdsRegimeFields() {
  const t = useT();
  // One option per regime key: the setting stores the key, and the year comes from the period.
  const { data, loading } = useTaxRegimeChoicesQuery({ fetchPolicy: 'cache-and-network' });
  const regimes = data?.taxRegimeChoices ?? [];
  const options: SelectOption[] = regimes.map((regime) => ({
    value: regime.regimeKey,
    label: regime.name,
  }));

  return (
    <>
      <RhfSelect
        name="tdsRegimeKey"
        label="Regime"
        options={options}
        helperText="The company default: the bands in HR › Tax Slabs a run walks for anyone without a regime of their own. The year comes from the period run."
      />
      {!loading && regimes.length === 0 && (
        <Text size="sm" color="warning.main">
          {t('No regimes on file yet — add one in HR › Tax Slabs, or nothing will be withheld.')}
        </Text>
      )}
      <RhfTextField
        name="financialYearStartMonth"
        label="Financial year starts in month"
        type="number"
        helperText="4 for a April–March year, 1 for a calendar one."
      />
    </>
  );
}
