import { isValidCurrency } from '../utils/iso';

/**
 * The currency a money record is kept in, declared once for every model that stores one.
 *
 * Stored as the ISO 4217 code and nothing else: trimmed, upper-cased, and refused when it is
 * not a code the runtime knows. Free text such as '₹' or 'Rupee' used to be accepted here and
 * then crashed every screen that formatted the amount.
 */
export const currencyField = {
  type: String,
  required: true,
  trim: true,
  uppercase: true,
  validate: {
    validator: isValidCurrency,
    message: (props: { value: unknown }) =>
      `${String(props.value)} is not an ISO 4217 currency code`,
  },
} as const;
