import type { z } from 'zod';
import type { loginSchema } from './login.schema';

export type LoginValues = z.infer<typeof loginSchema>;
