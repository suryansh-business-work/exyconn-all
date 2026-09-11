import type { z } from 'zod';
import type { presenceSchema } from './presence.schema';

export type PresenceValues = z.infer<typeof presenceSchema>;
