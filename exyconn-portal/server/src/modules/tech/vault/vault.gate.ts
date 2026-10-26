import { runAsPlatform } from '../../../lib/tenant';
import { forbidden } from '../../../utils/errors';
import { VaultSessionModel } from './vault-session.model';

/**
 * The lock in front of Tech configuration, kept apart from the vault service so the central
 * permission guard (lib/platformAccess) can use it without importing email or users.
 */

/** The user's session that is still open, or null. */
export function openVaultSession(userId: string) {
  return runAsPlatform(() =>
    VaultSessionModel.findOne({ userId, endedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ expiresAt: -1 })
      .lean(),
  );
}

/** Refuses unless the user unlocked Environment Variables within the last half hour. */
export async function assertVaultOpen(userId: string): Promise<void> {
  if (!(await openVaultSession(userId))) {
    forbidden('Environment Variables are locked. Unlock them with a one-time code first.');
  }
}
