import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
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
  const { locale, settings } = useI18n();
  const { getValues, setValue } = useFormContext();
  const options = useMemo(
    () => currencyOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );

  // The company's settings may land after this form opened — a dialog opened on a cold cache
  // does exactly that. Filling the field in when they arrive is what stops a new record being
  // saved with no currency at all; a currency already chosen is never overwritten.
  useEffect(() => {
    if (settings.currency && !getValues(name)) {
      setValue(name, settings.currency);
    }
  }, [settings.currency, name, getValues, setValue]);

  return <RhfAutocomplete name={name} label={label} options={options} helperText={helperText} />;
}

/** The company's own currency, for a form that is filling in a new money record. */
export function useCompanyCurrency(): string {
  return useI18n().settings.currency;
}
