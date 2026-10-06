import type { z } from "zod";
import type { CaptchaCopy, FieldCopy, SubmitCopy } from "../shared";
import type { indiaOfferFormSchema } from "./india-offer.schema";

/** What the India offer form holds; the captcha answer is checked locally and never sent. */
export type IndiaOfferFormValues = z.infer<ReturnType<typeof indiaOfferFormSchema>>;

/** The offer form's validation messages (Hindi). */
export interface IndiaOfferFormMessages {
  nameRequired: string;
  nameTooShort: string;
  nameTooLong: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  businessTooLong: string;
  planRequired: string;
  messageTooLong: string;
  captchaRequired: string;
}

/** Every word of the offer form (part of the 'offer.page' props). */
export interface IndiaOfferFormCopy {
  fields: Readonly<Record<"name" | "phone" | "email" | "business" | "message", FieldCopy>>;
  /** The plan select; its placeholder is the disabled first option. */
  plan: FieldCopy;
  /** The last option: no plan yet, advice wanted (sent as "custom"). */
  customPlan: string;
  /** The tag beside the popular plan, e.g. "Smart Biz — ₹9,999 (लोकप्रिय)". */
  popularShort: string;
  captcha: Omit<CaptchaCopy, "hint">;
  success: string;
  submit: string;
  sending: string;
  status: SubmitCopy;
  messages: IndiaOfferFormMessages;
}
