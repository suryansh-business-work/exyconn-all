import type { z } from "zod";
import type { quoteFormSchema } from "./quote.schema";

/** What the quote form holds; the captcha answer is checked by the portal and never stored. */
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

/** A radio card: an option's id, its name and an optional second line. */
export interface ChoiceOption {
  id: string;
  label: string;
  detail?: string;
}
