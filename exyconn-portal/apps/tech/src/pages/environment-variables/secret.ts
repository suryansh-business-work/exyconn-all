import { z } from 'zod';

/**
 * The platform credentials on these screens are write-only: the API says whether one is stored
 * and, for a long token, its last four characters — never the value. So an edit form starts
 * with the field empty, and leaving it empty keeps what is stored.
 */

/** Helper text for a secret field on an edit form. */
export const KEEP_SECRET_HINT = 'Leave blank to keep the current value';

/** A rule a typed secret must meet, e.g. a token prefix. */
interface SecretCheck {
  test: (value: string) => boolean;
  message: string;
}

/**
 * A secret's schema: required when creating, optional when editing (blank keeps the stored
 * value). `check` validates anything actually typed.
 */
export function secretField(isEdit: boolean, requiredMessage: string, check?: SecretCheck) {
  const typed = isEdit ? z.string().trim() : z.string().trim().min(1, requiredMessage);
  if (!check) {
    return typed;
  }
  return typed.refine((value) => value === '' || check.test(value), check.message);
}

/** How a grid shows a stored secret: its last characters when the API gives them, else a mask. */
export function maskedSecret(stored: boolean, hint?: string | null): string {
  if (hint) {
    return `••••${hint}`;
  }
  return stored ? '••••' : '—';
}
