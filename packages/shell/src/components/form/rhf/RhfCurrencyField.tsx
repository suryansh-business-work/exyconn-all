import { useMemo } from 'react';
import { currencyOptions, useI18n } from '@exyconn/i18n';
import { RhfAutocomplete } from './RhfAutocomplete';

interface RhfCurrencyFieldProps {
  name?: string;
  label?: string;
  helperText?: string;
}

/**
 * The ISO 4217 currency a money record is denominated in, searchable and named in the
 * reader's own language.
 *
 * Every money form used to type the code into a free-text box that started life as `INR`.
 * The codes come from the runtime's own ICU tables (`currencyOptions`), which is the same
 * list the server validates an organization's currency against.
 */
export function RhfCurrencyField({
  name = 'currency',
  label = 'Currency',
  helperText,
}: Readonly<RhfCurrencyFieldProps>) {
  const { locale } = useI18n();
  const options = useMemo(
    () => currencyOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );
  return <RhfAutocomplete name={name} label={label} options={options} helperText={helperText} />;
}

/** The company's own currency, for a form that is filling in a new money record. */
export function useCompanyCurrency(): string {
  return useI18n().settings.currency;
}
