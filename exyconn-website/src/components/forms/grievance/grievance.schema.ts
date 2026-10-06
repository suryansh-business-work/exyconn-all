import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { GrievanceFormMessages, GrievanceFormValues } from "./grievance.types";

/** The grievance form's rules, with the messages the page's copy gives them. */
export const grievanceFormSchema = (m: GrievanceFormMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).min(2, m.tooShort).max(100, m.tooLong),
    email: requiredEmail(m.emailRequired, m.emailInvalid),
    subject: z
      .string()
      .min(1, m.subjectRequired)
      .min(5, m.subjectTooShort)
      .max(200, m.subjectTooLong),
    message: z
      .string()
      .min(1, m.messageRequired)
      .min(20, m.messageTooShort)
      .max(3000, m.messageTooLong),
    captcha: captchaAnswer(m.captchaRequired),
  });

export const GRIEVANCE_FORM_DEFAULTS: GrievanceFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  captcha: "",
};
