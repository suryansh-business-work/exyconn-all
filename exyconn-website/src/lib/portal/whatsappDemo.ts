import { portalRequest } from "./client";
import type { CaptchaAnswer } from "./submit";

const REQUEST_CODE = `
  mutation RequestWhatsappDemoCode($input: WhatsappDemoCodeInput!, $captcha: WebsiteCaptchaAnswer) {
    requestWhatsappDemoCode(input: $input, captcha: $captcha)
  }
`;

const VERIFY_CODE = `
  mutation VerifyWhatsappDemoCode($email: String!, $code: String!) {
    verifyWhatsappDemoCode(email: $email, code: $code) {
      token
      demoUrl
      visitor {
        name
        email
      }
    }
  }
`;

/** Who is asking to try the live WhatsApp demo — filed as a lead in Website › WhatsApp Leads. */
export interface DemoLead {
  name: string;
  email: string;
  company: string;
  phone: string;
}

/** A signed-in demo visitor: the demo-only pass, and where the demo is. */
export interface DemoSignIn {
  token: string;
  demoUrl: string;
  visitor: { name: string; email: string };
}

/**
 * Files the lead and has the portal email the "thank you for your live demo" code. The
 * website's security question is answered here, so the portal does not limit the website's
 * single server address per network.
 */
export async function requestDemoCode(lead: DemoLead, captcha: CaptchaAnswer): Promise<void> {
  await portalRequest<{ requestWhatsappDemoCode: boolean }>(REQUEST_CODE, {
    input: { ...lead, source: "WEBSITE" },
    captcha,
  });
}

/** Exchanges the emailed code for the visitor's demo pass. */
export async function verifyDemoCode(email: string, code: string): Promise<DemoSignIn> {
  const result = await portalRequest<{ verifyWhatsappDemoCode: DemoSignIn }>(VERIFY_CODE, {
    email,
    code,
  });
  return result.verifyWhatsappDemoCode;
}
