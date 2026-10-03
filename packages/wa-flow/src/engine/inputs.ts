/**
 * Validation for free-text capture. Patterns come from @exyconn/regex (which is why the engine
 * is a browser-side entry: that package ships source only).
 */
import { z } from 'zod';
import {
  DAY_MONTH_YEAR,
  EMAIL,
  INDIAN_MOBILE,
  INDIAN_PINCODE,
  PERSON_NAME,
  PHONE,
} from '@exyconn/regex';
import type { InputKind } from '../schema';

/** Shown when a node sets no `error` of its own. English sources, translated by the engine. */
export const DEFAULT_INPUT_ERRORS: Readonly<Record<InputKind, string>> = {
  name: 'Please type your full name using letters only.',
  phone: 'That does not look like a mobile number. Please type 10 digits, e.g. 98765 43210.',
  email: 'That does not look like an email address. Please check and type it again.',
  date: 'Please type the date as DD/MM/YYYY, e.g. 14/08/1990.',
  pincode: 'Please type a 6-digit PIN code, e.g. 560034.',
  number: 'Please type a number.',
  text: 'Please type a little more detail.',
};

const DIGITS_ONLY = /\D/g;

function parseDate(text: string, past: boolean, now: number): string | null {
  const match = DAY_MONTH_YEAR.exec(text);
  if (!match) {
    return null;
  }
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!real || (past && date.getTime() > now) || year < 1900) {
    return null;
  }
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

const SCHEMAS: Readonly<Record<Exclude<InputKind, 'date' | 'phone'>, z.ZodType<string>>> = {
  name: z.string().trim().regex(PERSON_NAME),
  email: z.string().trim().toLowerCase().regex(EMAIL),
  pincode: z.string().trim().regex(INDIAN_PINCODE),
  number: z
    .string()
    .trim()
    .refine((v) => Number.isFinite(Number(v)) && v !== ''),
  text: z.string().trim().min(2).max(300),
};

function parsePhone(text: string): string | null {
  const digits = text.replaceAll(DIGITS_ONLY, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (INDIAN_MOBILE.test(local)) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return PHONE.test(text.trim()) ? text.trim() : null;
}

/** The answer as stored, or null when it is not valid. */
export function parseInput(
  kind: InputKind,
  text: string,
  options: { past?: boolean; now: number },
): string | null {
  if (kind === 'date') {
    return parseDate(text.trim(), options.past ?? false, options.now);
  }
  if (kind === 'phone') {
    return parsePhone(text);
  }
  const parsed = SCHEMAS[kind].safeParse(text);
  return parsed.success ? parsed.data : null;
}
