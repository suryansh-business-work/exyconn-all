import { z } from 'zod';

/** Helper text for a write-only token on an edit form. */
export const KEEP_TOKEN_HINT = 'Leave blank to keep the stored value';

/** Required to create; blank on an edit keeps the stored value. */
export const tokenField = (isEdit: boolean, requiredMessage: string) => {
  const typed = z.string().trim().max(200, 'That is too long');
  return isEdit ? typed : typed.min(1, requiredMessage);
};

/** How a grid shows a stored token: its last characters when the API gives them, else a mask. */
export function maskedToken(stored: boolean, hint?: string | null): string {
  if (hint) {
    return `••••${hint}`;
  }
  return stored ? '••••' : '—';
}

/** The "Set as active" choices, as the select's string values. */
export const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];
