import { z } from 'zod';
import { parseCsv } from '@exyconn/csv';
import { EMAIL } from '@exyconn/regex';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import { MAX_NOTE } from '../suppression';

/** The server's limit for one bulk add. */
export const MAX_BULK = 5000;

export const bulkSuppressionSchema = z.object({
  addresses: z.string().trim().min(1, 'Paste some addresses or choose a CSV file'),
  reason: z.enum(SuppressionReason),
  note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters`),
});

export type BulkSuppressionValues = z.infer<typeof bulkSuppressionSchema>;

export interface ParsedAddresses {
  /** Unique, lower-cased, valid addresses. */
  valid: string[];
  /** Cells that look like an address but are not one. */
  invalid: string[];
  /** How many times an address was repeated in the input. */
  repeated: number;
}

/**
 * Every address in pasted text or a CSV file, whatever column it sits in. Header cells and
 * other words are ignored; anything with an @ that is not a valid address is reported.
 */
export function extractAddresses(text: string): ParsedAddresses {
  const cells = parseCsv(text)
    .flat()
    .flatMap((cell) => cell.split(/[\s;]+/))
    .map((cell) => cell.trim().toLowerCase())
    .filter((cell) => cell.includes('@'));
  const valid = cells.filter((cell) => EMAIL.test(cell));
  const unique = [...new Set(valid)];
  return {
    valid: unique,
    invalid: [...new Set(cells.filter((cell) => !EMAIL.test(cell)))],
    repeated: valid.length - unique.length,
  };
}
