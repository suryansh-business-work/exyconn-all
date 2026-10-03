import type { z } from "zod";
import type { orderAgentsSchema } from "./order-agents.schema";

/** What the order-agents form holds; the captcha answer is checked by the portal. */
export type OrderAgentsValues = z.infer<typeof orderAgentsSchema>;
