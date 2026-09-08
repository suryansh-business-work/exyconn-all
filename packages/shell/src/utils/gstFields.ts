import { z } from 'zod';

/** 15 characters: state code, PAN, entity number, the letter Z and a check character. */
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** A GST registration number, or blank for a party that has none. */
export const gstinField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(GSTIN_PATTERN, 'Enter a valid 15-character GSTIN')
  .or(z.literal(''));

/** A two-digit GST state code as the `gstStates` query lists them, or blank for not set. */
export const gstStateCodeField = z
  .string()
  .regex(/^\d{2}$/, 'Pick a state')
  .or(z.literal(''));
