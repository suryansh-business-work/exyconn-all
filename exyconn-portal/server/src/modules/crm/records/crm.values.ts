import { isEmailAddress } from '../../../utils/emailAddress';
import type { PropertyDef } from './crm.objects';

/**
 * Turns a value from a CSV cell, a form or a filter into what a property stores: trimmed text,
 * a lowercased email, a bare domain, a number, a Date, an option's value or a boolean. A value
 * that cannot be read says why in words the person who typed it can act on.
 */
export type Coerced = { ok: true; value: unknown } | { ok: false; error: string };

const MAX_TEXT = 10_000;
const TRUE_WORDS: ReadonlySet<string> = new Set(['true', 'yes', 'y', '1']);
const FALSE_WORDS: ReadonlySet<string> = new Set(['false', 'no', 'n', '0']);
/** A calendar date, 2026-10-15: the first ten characters of every value `date` accepts. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** What may follow the day: a time (`T10:30:00.000`) with an optional `Z` or `+05:30` zone. */
const ISO_TIME = /^[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?$/;
/** Digit-group separators and currency signs a spreadsheet leaves in a number. */
const NUMBER_NOISE = /[\s,₹$€£¥]/g;

const ok = (value: unknown): Coerced => ({ ok: true, value });
const fail = (error: string): Coerced => ({ ok: false, error });

export const isBlank = (raw: unknown): boolean =>
  raw === null || raw === undefined || (typeof raw === 'string' && raw.trim() === '');

/** A date (2026-10-15) or an ISO date-time — the only shapes that read the same everywhere. */
const isIsoDate = (value: string): boolean =>
  ISO_DAY.test(value.slice(0, 10)) && (value.length === 10 || ISO_TIME.test(value.slice(10)));

const isLabelChar = (c: string) => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '-';

/** `acme.co.in`: two or more dot-separated labels of letters, digits and inner hyphens. */
export function isDomainName(value: string): boolean {
  const labels = value.split('.');
  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        !label.startsWith('-') &&
        !label.endsWith('-') &&
        [...label].every(isLabelChar),
    )
  );
}

/** `https://www.Acme.com/about` -> `acme.com`. */
export function bareDomain(raw: string): string {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0];
  return host.startsWith('www.') ? host.slice(4) : host;
}

function text(property: PropertyDef, raw: unknown): Coerced {
  const value = String(raw).trim();
  if (value.length > MAX_TEXT) {
    return fail(`${property.label} is longer than ${MAX_TEXT} characters`);
  }
  if (property.type === 'EMAIL') {
    const email = value.toLowerCase();
    return isEmailAddress(email)
      ? ok(email)
      : fail(`${property.label} "${value}" is not an email address`);
  }
  if (property.type === 'URL' && property.builtIn) {
    const domain = bareDomain(value);
    return isDomainName(domain) ? ok(domain) : fail(`${property.label} "${value}" is not a domain`);
  }
  return ok(value);
}

function number(property: PropertyDef, raw: unknown): Coerced {
  const value = typeof raw === 'number' ? raw : Number(String(raw).replace(NUMBER_NOISE, ''));
  return Number.isFinite(value)
    ? ok(value)
    : fail(`${property.label} "${String(raw)}" is not a number`);
}

function date(property: PropertyDef, raw: unknown): Coerced {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? fail(`${property.label} is not a date`) : ok(raw);
  }
  const value = String(raw).trim();
  const parsed = isIsoDate(value) ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? ok(parsed)
    : fail(`${property.label} "${value}" is not a date; use a date like 2026-10-15`);
}

function choice(property: PropertyDef, raw: unknown): Coerced {
  const wanted = String(raw).trim().toLowerCase();
  const match = property.options.find(
    (option) => option.value.toLowerCase() === wanted || option.label.toLowerCase() === wanted,
  );
  if (match) {
    return ok(match.value);
  }
  const allowed = property.options.map((option) => option.label).join(', ');
  return fail(`${property.label} "${String(raw).trim()}" is not one of: ${allowed}`);
}

function bool(property: PropertyDef, raw: unknown): Coerced {
  if (typeof raw === 'boolean') {
    return ok(raw);
  }
  const word = String(raw).trim().toLowerCase();
  if (TRUE_WORDS.has(word)) {
    return ok(true);
  }
  return FALSE_WORDS.has(word)
    ? ok(false)
    : fail(`${property.label} "${String(raw)}" is not yes or no`);
}

/**
 * Several choices: an array from a form, or "A; B" / "A, B" from a CSV cell. Each must be one
 * of the property's choices; the stored value keeps them in the property's order.
 */
function choices(property: PropertyDef, raw: unknown): Coerced {
  const parts = Array.isArray(raw) ? raw : String(raw).split(/[;,]/);
  const values: string[] = [];
  for (const part of parts.filter((item) => !isBlank(item))) {
    const one = choice(property, part);
    if (!one.ok) {
      return one;
    }
    values.push(one.value as string);
  }
  const chosen = new Set(values);
  return ok(property.options.map((option) => option.value).filter((value) => chosen.has(value)));
}

/** A file is the https address it was uploaded to. */
function file(property: PropertyDef, raw: unknown): Coerced {
  const value = String(raw).trim();
  return value.startsWith('https://') && value.length <= 2000
    ? ok(value)
    : fail(`${property.label} must be an uploaded file`);
}

/** A blank value is `null`; whether a blank is allowed is the caller's to decide. */
export function coerceValue(property: PropertyDef, raw: unknown): Coerced {
  if (isBlank(raw)) {
    return ok(null);
  }
  switch (property.type) {
    case 'NUMBER':
      return number(property, raw);
    case 'DATE':
      return date(property, raw);
    case 'ENUM':
    case 'RADIO':
      return choice(property, raw);
    case 'MULTI_SELECT':
      return choices(property, raw);
    case 'FILE':
      return file(property, raw);
    case 'BOOLEAN':
      return bool(property, raw);
    default:
      return text(property, raw);
  }
}
