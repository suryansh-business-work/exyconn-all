import { z } from "zod";
import { HTTP_URL } from "@exyconn/regex";
import { captchaAnswer, optionalMatch, requiredEmail } from "../shared/fieldSchemas";
import type { LegalFormMessages, LegalFormValues } from "./legal.types";

/** The legal request form's rules, with the messages the page's copy gives them. */
export const legalFormSchema = (m: LegalFormMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).min(2, m.tooShort).max(100, m.tooLong),
    email: requiredEmail(m.emailRequired, m.emailInvalid),
    legalType: z.string().min(1, m.typeRequired),
    url: optionalMatch(HTTP_URL, m.urlInvalid),
    details: z
      .string()
      .min(1, m.detailsRequired)
      .min(20, m.detailsTooShort)
      .max(5000, m.detailsTooLong),
    captcha: captchaAnswer(m.captchaRequired),
  });

export const LEGAL_FORM_DEFAULTS: LegalFormValues = {
  name: "",
  email: "",
  legalType: "",
  url: "",
  details: "",
  captcha: "",
};
