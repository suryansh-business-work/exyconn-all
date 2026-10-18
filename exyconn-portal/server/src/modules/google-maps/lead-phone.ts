/**
 * Phone numbers as the lead matcher compares them. Google gives a business's number in
 * international form (+91 20 1234 5678) while a CRM user may have typed it nationally
 * (020 1234 5678), so two numbers are the same when their E.164 digits are equal, or when the
 * national number (leading zeros dropped) is the tail of the international one.
 */

export interface PhoneKey {
  digits: string;
  international: boolean;
}

/** Fewer digits than this is not a phone number worth matching on. */
const MIN_DIGITS = 7;

/** The digits of a number and whether they include the country code; null when too short. */
export function toPhoneKey(value: string | null | undefined): PhoneKey | null {
  const raw = (value ?? '').trim();
  let digits = raw.replaceAll(/\D/g, '');
  let international = raw.startsWith('+');
  if (!international && digits.startsWith('00')) {
    digits = digits.slice(2);
    international = true;
  }
  if (!international) {
    digits = digits.replace(/^0+/, '');
  }
  return digits.length >= MIN_DIGITS ? { digits, international } : null;
}

/** Whether two typed numbers are the same phone. */
export function phonesMatch(a: string, b: string): boolean {
  const left = toPhoneKey(a);
  const right = toPhoneKey(b);
  if (!left || !right) {
    return false;
  }
  if (left.international === right.international) {
    return left.digits === right.digits;
  }
  const [full, national] = left.international ? [left, right] : [right, left];
  return full.digits.endsWith(national.digits);
}

const SEPARATORS = String.raw`\D*`;

/** A pattern for stored numbers ending in the same last digits, however they are punctuated. */
export function phoneTailPattern(key: PhoneKey): RegExp {
  const tail = key.digits.slice(-MIN_DIGITS).split('').join(SEPARATORS);
  return new RegExp(tail + SEPARATORS + '$');
}
