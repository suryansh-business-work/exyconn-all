import { useEffect, useMemo, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { countryName, currencyOptions, useI18n, useT } from '@exyconn/i18n';
import { taxIdType, taxIdTypesFor, type TaxIdType } from '@exyconn/regex';
import { RhfAutocomplete, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useGstStateOptions } from '@exyconn/shell/hooks/useGstStateOptions';
import { GST_COUNTRY, type ClientFormValues } from './client.types';
import { ClientSection } from './client-section';

/** The kinds of number the country issues, keeping a stored kind the country no longer lists. */
function typesOffered(country: string, current: string): TaxIdType[] {
  const offered = taxIdTypesFor(country);
  const stored = taxIdType(current);
  if (stored && !offered.includes(stored)) {
    return [stored, ...offered];
  }
  return offered;
}

/**
 * Follows the country: a new country picks its first kind of tax number (unless a number is
 * already typed), and leaving India clears the GST state, which only Indian clients carry.
 */
function useCountryDefaults(country: string) {
  const { getValues, setValue } = useFormContext<ClientFormValues>();
  const previous = useRef(country);
  useEffect(() => {
    if (previous.current === country) {
      return;
    }
    previous.current = country;
    if (country !== GST_COUNTRY) {
      setValue('stateCode', '');
    }
    if (getValues('taxId').trim() === '') {
      // Every country is offered the generic "Tax ID" kind, so the list is never empty.
      for (const { code } of taxIdTypesFor(country).slice(0, 1)) {
        setValue('taxIdType', code);
      }
    }
  }, [country, getValues, setValue]);
}

/** The client's tax registration and the currency their invoices are raised in. */
export function ClientTaxFields() {
  const t = useT();
  const { locale } = useI18n();
  const { control } = useFormContext<ClientFormValues>();
  const country = useWatch({ control, name: 'country' });
  const typeCode = useWatch({ control, name: 'taxIdType' });
  const stateOptions = useGstStateOptions();
  useCountryDefaults(country);

  const typeOptions = useMemo(
    () =>
      typesOffered(country, typeCode).map((type) => {
        const where =
          type.countries.length === 0 ? t('any country') : countryName(type.countries[0], locale);
        const place = type.countries.includes(country) ? countryName(country, locale) : where;
        return { value: type.code, label: t('{label} ({place})', { label: t(type.label), place }) };
      }),
    [country, typeCode, t, locale],
  );
  const currencies = useMemo(
    () => currencyOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );
  const example = taxIdType(typeCode)?.example;
  const taxIdHint = example
    ? t('For example {example}', { example })
    : 'Choose the type first, then type the number';

  return (
    <ClientSection title="Tax & billing">
      <RhfSelect name="taxIdType" label="Tax number type" options={typeOptions} />
      <RhfTextField name="taxId" label="Tax number" helperText={taxIdHint} />
      {country === GST_COUNTRY && (
        <RhfSelect
          name="stateCode"
          label="GST state"
          options={stateOptions}
          helperText="The default place of supply on their invoices"
        />
      )}
      <RhfAutocomplete
        name="currency"
        label="Invoicing currency"
        options={currencies}
        helperText="Leave empty to invoice in the company's currency"
      />
    </ClientSection>
  );
}
