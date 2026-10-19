import { z } from 'zod';
import { EMAIL, HTTP_URL, PHONE } from '@exyconn/regex';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { CHOICE_TYPES, scalarText, type CrmPropertyInfo } from '../schema';

/** What the forms need to know about a custom property; both property queries return it. */
export type CustomPropertyDef = Pick<
  CrmPropertyInfo,
  'key' | 'label' | 'type' | 'options' | 'required' | 'description'
>;

/**
 * A custom value as the form holds it: always a string. A number is typed text, a date is
 * `yyyy-MM-dd`, a Yes/No is `'true'`/`'false'`, and an unset value is `''`, so every input
 * can be cleared and "not set" is never confused with "No" or 0.
 */
export type CustomFormValues = Record<string, string>;
/** A custom value as the server stores it. */
export type CustomInputValue = string | number | boolean | string[];

/** How a multi-select's choices sit in the form's one string: one value per line. */
export const MULTI_SEPARATOR = '\n';

/** The longest text the server keeps in one value. */
const MAX_TEXT = 10_000;

/** Messages are English sources; the field translates them when it shows one. */
export const CUSTOM_FIELD_MESSAGES = {
  required: 'This field is required',
  tooLong: 'This is longer than 10,000 characters',
  email: 'Enter a valid email, e.g. name@company.com',
  phone: 'Enter a valid phone number',
  url: 'Enter a full web address, starting with https://',
  number: 'Enter a number',
  choice: 'Pick one of the choices',
  file: 'Upload the file again',
} as const;

const PATTERNS: Partial<Record<CrmPropertyType, { pattern: RegExp; message: string }>> = {
  [CrmPropertyType.Email]: { pattern: EMAIL, message: CUSTOM_FIELD_MESSAGES.email },
  [CrmPropertyType.Phone]: { pattern: PHONE, message: CUSTOM_FIELD_MESSAGES.phone },
  [CrmPropertyType.Url]: { pattern: HTTP_URL, message: CUSTOM_FIELD_MESSAGES.url },
};

const BOOLEAN_VALUES: ReadonlySet<string> = new Set(['true', 'false']);

const isNumber = (value: string) => value.trim() !== '' && Number.isFinite(Number(value));

/** Whether a filled-in value is one this property accepts. Blank is handled by the caller. */
function acceptsValue(property: CustomPropertyDef, value: string): boolean {
  switch (property.type) {
    case CrmPropertyType.Number:
      return isNumber(value);
    case CrmPropertyType.Enum:
    case CrmPropertyType.Radio:
      return property.options.some((option) => option.value === value);
    case CrmPropertyType.MultiSelect:
      return value
        .split(MULTI_SEPARATOR)
        .every((one) => property.options.some((option) => option.value === one));
    case CrmPropertyType.File:
      return value.startsWith('https://');
    case CrmPropertyType.Boolean:
      return BOOLEAN_VALUES.has(value);
    default:
      return PATTERNS[property.type]?.pattern.test(value) ?? true;
  }
}

function invalidMessage(type: CrmPropertyType): string {
  if (type === CrmPropertyType.Number) {
    return CUSTOM_FIELD_MESSAGES.number;
  }
  if (CHOICE_TYPES.has(type) || type === CrmPropertyType.Boolean) {
    return CUSTOM_FIELD_MESSAGES.choice;
  }
  if (type === CrmPropertyType.File) {
    return CUSTOM_FIELD_MESSAGES.file;
  }
  return PATTERNS[type]?.message ?? CUSTOM_FIELD_MESSAGES.required;
}

/** One property's rule: required or optional, then read as its type. */
function fieldSchema(property: CustomPropertyDef) {
  return z
    .string()
    .trim()
    .max(MAX_TEXT, CUSTOM_FIELD_MESSAGES.tooLong)
    .refine((value) => !property.required || value !== '', CUSTOM_FIELD_MESSAGES.required)
    .refine(
      (value) => value === '' || acceptsValue(property, value),
      invalidMessage(property.type),
    );
}

/** The `custom` part of a record form's schema, one rule per custom property. */
export function customFieldsSchema(properties: readonly CustomPropertyDef[]) {
  return z.object(
    Object.fromEntries(properties.map((property) => [property.key, fieldSchema(property)])),
  );
}

/** A stored value as the form's string, `''` when there is none. */
function toFormValue(property: CustomPropertyDef, stored: unknown): string {
  if (stored === null || stored === undefined) {
    return '';
  }
  if (property.type === CrmPropertyType.Date) {
    // Stored as an ISO date or date-time; the form edits the calendar day.
    return scalarText(stored).slice(0, 10);
  }
  if (Array.isArray(stored)) {
    return stored.map(String).join(MULTI_SEPARATOR);
  }
  return scalarText(stored);
}

/**
 * The form's starting `custom` values: one entry per current property, read from the record
 * (`row.custom`, which may be missing on rows from older queries). Values of a property that
 * has since been deleted are left out, as the server would refuse them.
 */
export function customDefaults(
  properties: readonly CustomPropertyDef[],
  stored: unknown,
): CustomFormValues {
  const values = (stored ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    properties.map((property) => [property.key, toFormValue(property, values[property.key])]),
  );
}

function toInputValue(property: CustomPropertyDef, value: string): CustomInputValue {
  if (property.type === CrmPropertyType.Number) {
    return Number(value);
  }
  if (property.type === CrmPropertyType.Boolean) {
    return value === 'true';
  }
  if (property.type === CrmPropertyType.MultiSelect) {
    return value.split(MULTI_SEPARATOR).filter(Boolean);
  }
  return value;
}

/** The `custom` the server takes: blanks dropped, numbers and Yes/No converted. */
export function toCustomInput(
  properties: readonly CustomPropertyDef[],
  values: CustomFormValues | undefined,
): Record<string, CustomInputValue> {
  const input: Record<string, CustomInputValue> = {};
  for (const property of properties) {
    const value = values?.[property.key]?.trim() ?? '';
    if (value !== '') {
      input[property.key] = toInputValue(property, value);
    }
  }
  return input;
}
