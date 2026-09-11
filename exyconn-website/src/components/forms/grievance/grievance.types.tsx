import type { z } from "zod";
import type { grievanceFormSchema } from "./grievance.schema";

/** What the grievance form holds; the captcha answer is checked locally and never sent. */
export type GrievanceFormValues = z.infer<typeof grievanceFormSchema>;
