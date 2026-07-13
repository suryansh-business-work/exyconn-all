import { z } from "zod";

export const extractContactsSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
  maxPages: z.number().min(1).max(50).default(5),
  followLinks: z.boolean().default(true),
});

export type ExtractContactsInput = z.infer<typeof extractContactsSchema>;
