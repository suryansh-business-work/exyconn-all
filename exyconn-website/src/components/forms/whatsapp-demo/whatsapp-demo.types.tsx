import type { z } from "zod";
import type { demoCodeSchema, demoLeadSchema } from "./whatsapp-demo.schema";

/** What step one holds; the captcha answer is sent for the portal to check. */
export type DemoLeadValues = z.infer<typeof demoLeadSchema>;
export type DemoCodeValues = z.infer<typeof demoCodeSchema>;

/** A verified visitor: their demo-only pass and where the demo lives. */
export interface DemoAccess {
  token: string;
  demoUrl: string;
  name: string;
}
