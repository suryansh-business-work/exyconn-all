import { z } from "zod";
import { INDIAN_MOBILE } from "@exyconn/regex";
import { captchaAnswer, requiredEmail } from "../shared/fieldSchemas";
import type { IndiaOfferFormMessages, IndiaOfferFormValues } from "./india-offer.types";

/** The offer form's rules, with the messages the page's copy gives them. */
export const indiaOfferFormSchema = (m: IndiaOfferFormMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).min(2, m.nameTooShort).max(50, m.nameTooLong),
    phone: z.string().trim().min(1, m.phoneRequired).regex(INDIAN_MOBILE, m.phoneInvalid),
    email: requiredEmail(m.emailRequired, m.emailInvalid),
    business: z.string().max(100, m.businessTooLong),
    plan: z.string().min(1, m.planRequired),
    message: z.string().max(500, m.messageTooLong),
    captcha: captchaAnswer(m.captchaRequired),
  });

export const INDIA_OFFER_FORM_DEFAULTS: IndiaOfferFormValues = {
  name: "",
  phone: "",
  email: "",
  business: "",
  plan: "",
  message: "",
  captcha: "",
};
