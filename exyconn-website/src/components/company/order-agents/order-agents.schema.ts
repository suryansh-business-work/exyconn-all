import { z } from "zod";
import { captchaAnswer, requiredEmail } from "../../forms/shared/fieldSchemas";
import { AGENTS, agentsText } from "../../../lib/company/agents";
import type { OrderAgentsValues } from "./order-agents.types";

const AGENT_IDS = AGENTS.map((agent) => agent.id) as [string, ...string[]];

const personName = (label: string) =>
  z.string().trim().min(1, `${label} is required`).min(2, "Too short!").max(50, "Too long!");

/** A suite request: at least one agent, who to reply to, and the security answer. */
export const orderAgentsSchema = z.object({
  agentIds: z.array(z.enum(AGENT_IDS)).min(1, agentsText.pickOne),
  firstName: personName("First name"),
  lastName: personName("Last name"),
  email: requiredEmail(),
  company: z.string().trim().max(100, "Too long!"),
  notes: z.string().trim().max(1000, "Too long!"),
  captcha: captchaAnswer(),
});

export const ORDER_AGENTS_DEFAULTS: OrderAgentsValues = {
  agentIds: [],
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  notes: "",
  captcha: "",
};
