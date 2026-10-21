import { angleSpans } from './campaign.mjml';
import { EmailConfigModel } from '../tech/email-config.model';

/** The address in `Name <address>`, or a bare address whole, as the SMTP configuration stores it. */
export function addressOf(from: string): string {
  const first = angleSpans(from).next();
  const address = first.done ? from : from.slice(first.value[0] + 1, first.value[1]);
  return address.trim().toLowerCase();
}

/**
 * The sender addresses a campaign may use: the active SMTP configuration's from address, the
 * one identity the mail provider has verified for this organization. Anything else would be
 * rejected by the provider or, worse, delivered as spoofed mail.
 */
export async function verifiedSenders(): Promise<string[]> {
  const config = await EmailConfigModel.findOne({ isActive: true }).select('fromAddress').lean();
  return config ? [addressOf(config.fromAddress)] : [];
}

export const isVerifiedSender = async (email: string): Promise<boolean> =>
  (await verifiedSenders()).includes(email.trim().toLowerCase());
