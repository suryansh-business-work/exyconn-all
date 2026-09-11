import type { z } from "zod";
import type { careerFormSchema } from "./career.schema";

/**
 * What the career form holds. The resume sits outside it (only its file name is sent) and the
 * captcha answer is checked locally and never sent.
 */
export type CareerFormValues = z.infer<typeof careerFormSchema>;
