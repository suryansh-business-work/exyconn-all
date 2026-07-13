import { z } from "zod";

export const findSitemapsSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
  checkCommonPaths: z.boolean().default(true),
  parseRobotsTxt: z.boolean().default(true),
  maxDepth: z.number().min(1).max(5).default(2),
});

export type FindSitemapsInput = z.infer<typeof findSitemapsSchema>;
