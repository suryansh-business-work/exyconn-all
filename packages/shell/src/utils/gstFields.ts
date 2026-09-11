import { z } from 'zod';
import { GSTIN, GST_STATE_CODE } from '@exyconn/regex';

/** A GST registration number, or blank for a party that has none. */
export const gstinField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(GSTIN, 'Enter a valid 15-character GSTIN')
  .or(z.literal(''));

/** A two-digit GST state code as the `gstStates` query lists them, or blank for not set. */
export const gstStateCodeField = z.string().regex(GST_STATE_CODE, 'Pick a state').or(z.literal(''));
