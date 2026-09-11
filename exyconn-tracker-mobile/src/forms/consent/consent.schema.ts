import { z } from 'zod';

/**
 * The typed signature under a Legal policy. Required only when the policy asks to be SIGNED
 * (`requiresAcknowledgement`) — the portal refuses an empty one then, and ignores it otherwise.
 */
export function consentSchema(mustSign: boolean) {
  const signedName = z.string().trim();
  return z.object({
    signedName: mustSign ? signedName.min(1, 'Type your full name to sign.') : signedName,
  });
}
