import type { z } from "zod";
import type { CaptchaCopy, FieldCopy, FinePrintCopy, OptionCopy, SubmitCopy } from "../shared";
import type { contactFormSchema } from "./contact.schema";

/** What the contact form holds; the captcha answer is checked locally and never sent. */
export type ContactFormValues = z.infer<ReturnType<typeof contactFormSchema>>;

/** The contact form's validation messages. */
export interface ContactFormMessages {
  firstNameRequired: string;
  lastNameRequired: string;
  tooShort: string;
  tooLong: string;
  emailRequired: string;
  emailInvalid: string;
  subjectRequired: string;
  messageRequired: string;
  messageTooShort: string;
  messageTooLong: string;
  captchaRequired: string;
}

/** Every word of the contact form (CMS props of 'company.contact'). */
export interface ContactFormCopy {
  formLabel: string;
  success: string;
  fields: Readonly<Record<"firstName" | "lastName" | "email" | "company" | "message", FieldCopy>>;
  subject: FieldCopy;
  /** The topics; the values are what the portal files the message under. */
  subjects: readonly OptionCopy[];
  submit: string;
  sending: string;
  finePrint: FinePrintCopy;
  captcha: CaptchaCopy;
  status: SubmitCopy;
  messages: ContactFormMessages;
}
