import type { z } from "zod";
import type { indiaOfferFormSchema } from "./india-offer.schema";

/** What the India offer form holds; the captcha answer is checked locally and never sent. */
export type IndiaOfferFormValues = z.infer<typeof indiaOfferFormSchema>;
