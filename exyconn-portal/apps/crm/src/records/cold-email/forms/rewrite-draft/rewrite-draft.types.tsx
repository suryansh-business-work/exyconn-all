import { z } from 'zod';

export const rewriteDraftSchema = z.object({
  /** Read their website through Firecrawl again before writing. */
  readWebsite: z.boolean(),
});

export type RewriteDraftValues = z.infer<typeof rewriteDraftSchema>;
