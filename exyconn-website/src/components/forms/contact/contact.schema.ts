import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { ContactFormMessages, ContactFormValues } from "./contact.types";

/** The contact form's rules, with the messages the page's copy gives them. */
export const contactFormSchema = (m: ContactFormMessages) =>
  z.object({
    firstName: z.string().min(1, m.firstNameRequired).min(2, m.tooShort).max(50, m.tooLong),
    lastName: z.string().min(1, m.lastNameRequired).min(2, m.tooShort).max(50, m.tooLong),
    email: requiredEmail(m.emailRequired, m.emailInvalid),
    company: z.string().max(100, m.tooLong),
    subject: z.string().min(1, m.subjectRequired),
    message: z
      .string()
      .min(1, m.messageRequired)
      .min(10, m.messageTooShort)
      .max(1000, m.messageTooLong),
    captcha: captchaAnswer(m.captchaRequired),
  });

export const CONTACT_FORM_DEFAULTS: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  subject: "",
  message: "",
  captcha: "",
};
