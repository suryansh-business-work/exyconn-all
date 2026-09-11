import type { z } from "zod";
import type { contactFormSchema } from "./contact.schema";

/** What the contact form holds; the captcha answer is checked locally and never sent. */
export type ContactFormValues = z.infer<typeof contactFormSchema>;
