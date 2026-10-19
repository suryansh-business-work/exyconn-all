import { z } from 'zod';
import { ColdEmailTone } from '@exyconn/shell/graphql/generated';

export const MAX_INSTRUCTION_CHARS = 500;

export const anotherVariantSchema = z.object({
  /** What the new version should do differently; optional. */
  instruction: z
    .string()
    .trim()
    .max(MAX_INSTRUCTION_CHARS, `Keep the instruction under ${MAX_INSTRUCTION_CHARS} characters`),
  tone: z.enum(ColdEmailTone),
});

export type AnotherVariantValues = z.infer<typeof anotherVariantSchema>;
