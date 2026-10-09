import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../../forms/shared/fieldSchemas";
import type { OrderAgentsMessages, OrderAgentsValues } from "./order-agents.types";

/** A suite request: at least one of the agents on offer, who to reply to, the security answer. */
export const orderAgentsSchema = (agentIds: readonly string[], m: OrderAgentsMessages) => {
  const personName = (required: string) =>
    z.string().trim().min(1, required).min(2, m.tooShort).max(50, m.tooLong);
  return z.object({
    agentIds: z.array(z.enum(agentIds)).min(1, m.pickOne),
    firstName: personName(m.firstNameRequired),
    lastName: personName(m.lastNameRequired),
    email: requiredEmail(m.emailRequired, m.emailInvalid),
    company: z.string().trim().max(100, m.tooLong),
    notes: z.string().trim().max(1000, m.tooLong),
    captcha: captchaAnswer(m.captchaRequired),
  });
};

export const ORDER_AGENTS_DEFAULTS: OrderAgentsValues = {
  agentIds: [],
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  notes: "",
  captcha: "",
};
