/** The same phone shape as @exyconn/regex PHONE, which the forms check first. */
const PHONE = /^\+?\(?\d[\d\s()-]{5,18}\d$/;

/** Whether `value` reads as a phone number: digits, spaces, brackets and dashes, 7–20 long. */
export function isPhoneNumber(value: string): boolean {
  return PHONE.test(value);
}
