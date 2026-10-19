import { z } from 'zod';
import { normalizeCurrency } from '@exyconn/i18n';

const INVALID = 'Choose a valid ISO 4217 currency';

/** Whether `code` is an ISO 4217 code exactly as stored — the server applies the same table. */
const isIsoCurrency = (code: string) => normalizeCurrency(code) === code;

/** The ISO 4217 currency a money record is denominated in. Every money form uses this. */
export const currencyField = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Currency is required')
  // A blank one is already "required"; saying it is also invalid would be noise.
  .refine((code) => code === '' || isIsoCurrency(code), INVALID);

/** An ISO 4217 currency, or blank for "the company's own" — a client's invoicing currency. */
export const optionalCurrencyField = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => code === '' || isIsoCurrency(code), INVALID);
