import type { z } from "zod";
import type { CaptchaCopy, FieldCopy, OptionCopy, SubmitCopy } from "../shared";
import type { legalFormSchema } from "./legal.schema";

/** What the legal request form holds; the captcha answer is checked locally and never sent. */
export type LegalFormValues = z.infer<ReturnType<typeof legalFormSchema>>;

/** The legal request form's validation messages. */
export interface LegalFormMessages {
  nameRequired: string;
  tooShort: string;
  tooLong: string;
  emailRequired: string;
  emailInvalid: string;
  typeRequired: string;
  urlInvalid: string;
  detailsRequired: string;
  detailsTooShort: string;
  detailsTooLong: string;
  captchaRequired: string;
}

/** Every word of the legal request form (CMS props of 'forms.legal'). */
export interface LegalFormCopy {
  formLabel: string;
  success: string;
  fields: Readonly<Record<"name" | "email" | "url" | "details", FieldCopy>>;
  /** The request type select; its placeholder is the disabled first option. */
  type: FieldCopy;
  /** The request types; the values are what the portal files the request under. */
  types: readonly OptionCopy[];
  submit: string;
  sending: string;
  finePrint: string;
  captcha: CaptchaCopy;
  status: SubmitCopy;
  messages: LegalFormMessages;
}
