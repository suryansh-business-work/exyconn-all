import type { z } from "zod";
import type { CaptchaCopy, SubmitCopy } from "../../forms/shared";
import type { orderAgentsSchema } from "./order-agents.schema";

/** What the order-agents form holds; the captcha answer is checked by the portal. */
export type OrderAgentsValues = z.infer<ReturnType<typeof orderAgentsSchema>>;

/** The order-agents form's validation messages. */
export interface OrderAgentsMessages {
  pickOne: string;
  firstNameRequired: string;
  lastNameRequired: string;
  tooShort: string;
  tooLong: string;
  emailRequired: string;
  emailInvalid: string;
  captchaRequired: string;
}

/** Every word of the build-your-suite form (CMS props of 'agents.order'). */
export interface OrderAgentsText {
  available: string;
  suite: string;
  add: string;
  added: string;
  remove: string;
  empty: string;
  /** Names {count} and {total}. */
  count: string;
  detailsTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  notes: string;
  optional: string;
  submit: string;
  sending: string;
  sent: string;
  captcha: CaptchaCopy;
  status: SubmitCopy;
  messages: OrderAgentsMessages;
}
