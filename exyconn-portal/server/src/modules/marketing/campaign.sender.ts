import { EmailConfigModel } from '../tech/email-config.model';

/** `Name <address>` or a bare address, as the SMTP configuration stores it. */
const ADDRESS_IN_ANGLES = /<([^>]+)>/;

const addressOf = (from: string): string =>
  (ADDRESS_IN_ANGLES.exec(from)?.[1] ?? from).trim().toLowerCase();

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
