import type { z } from 'zod';
import type { consentSchema } from './consent.schema';

type ConsentSchema = ReturnType<typeof consentSchema>;

/** What the signature box holds as it is typed. */
export type ConsentInput = z.input<ConsentSchema>;

/** What is recorded — the name already trimmed. */
export type ConsentValues = z.output<ConsentSchema>;
