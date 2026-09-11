import type { z } from "zod";
import type { legalFormSchema } from "./legal.schema";

/** What the legal request form holds; the captcha answer is checked locally and never sent. */
export type LegalFormValues = z.infer<typeof legalFormSchema>;
