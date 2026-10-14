/** The same phone shape as @exyconn/regex PHONE, which the forms check first. */
const PHONE = /^\+?\(?\d[\d\s()-]{5,18}\d$/;

/** Whether `value` reads as a phone number: digits, spaces, brackets and dashes, 7–20 long. */
export function isPhoneNumber(value: string): boolean {
  return PHONE.test(value);
}

/** The same shape as @exyconn/regex E164_PHONE: `+`, country code and number, digits only. */
const E164_PHONE = /^\+[1-9]\d{7,14}$/;

/** Whether `value` is a phone number in E.164, as a telephony provider dials it. */
export function isE164Phone(value: string): boolean {
  return E164_PHONE.test(value);
}
