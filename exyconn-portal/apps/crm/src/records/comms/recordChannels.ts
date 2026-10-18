/** A record's phone number and email fields, as the contact and company fragments carry them. */
interface Reachable {
  phone?: string | null;
  email?: string | null;
  phones?: ReadonlyArray<{ number: string }> | null;
  emails?: ReadonlyArray<{ address: string }> | null;
}

/** Spaces, dashes, dots and brackets people type in numbers; the dialler needs digits and "+". */
const NUMBER_PUNCTUATION = /[\s().-]/g;

/** A stored number as the dialler takes it, e.g. "+1 (415) 555-0100" → "+14155550100". */
export const dialable = (phone: string) => phone.replaceAll(NUMBER_PUNCTUATION, '');

const unique = (values: Array<string | null | undefined>) => [
  ...new Set(values.map((value) => (value ?? '').trim()).filter((value) => value !== '')),
];

/** Every number on the record, the main one first, without repeats. */
export const phonesOf = (record: Reachable) =>
  unique([record.phone, ...(record.phones ?? []).map((entry) => entry.number)]);

/** Every address on the record, the main one first, without repeats. */
export const emailsOf = (record: Reachable) =>
  unique([record.email, ...(record.emails ?? []).map((entry) => entry.address)]);
