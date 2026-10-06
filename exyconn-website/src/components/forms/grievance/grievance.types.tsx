import type { z } from "zod";
import type { CaptchaCopy, FieldCopy, SubmitCopy } from "../shared";
import type { grievanceFormSchema } from "./grievance.schema";

/** What the grievance form holds; the captcha answer is checked locally and never sent. */
export type GrievanceFormValues = z.infer<ReturnType<typeof grievanceFormSchema>>;

/** The grievance form's validation messages. */
export interface GrievanceFormMessages {
  nameRequired: string;
  tooShort: string;
  tooLong: string;
  emailRequired: string;
  emailInvalid: string;
  subjectRequired: string;
  subjectTooShort: string;
  subjectTooLong: string;
  messageRequired: string;
  messageTooShort: string;
  messageTooLong: string;
  captchaRequired: string;
}

/** Every word of the grievance form (CMS props of 'forms.grievance'). */
export interface GrievanceFormCopy {
  formLabel: string;
  success: string;
  fields: Readonly<Record<"name" | "email" | "subject" | "message", FieldCopy>>;
  submit: string;
  sending: string;
  finePrint: string;
  captcha: CaptchaCopy;
  status: SubmitCopy;
  messages: GrievanceFormMessages;
}
