import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../../lib/emailCode';
import { createLimiter, enforceLimit } from '../../../lib/rateLimiter';
import { runAsPlatform } from '../../../lib/tenant';
import type { GraphQLContext } from '../../../middleware/auth';
import { assertAuthenticated } from '../../../middleware/roleGuard';
import { badRequest } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { withId } from '../../../utils/serialize';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../../utils/tableQuery';
import { registerTable } from '../../table-transfer/registry';
import { UserModel } from '../../admin/user.model';
import { AuditLogModel } from '../../audit/audit.model';
import { emailer } from '../../email/email.service';
import { VaultSessionModel, type VAULT_LOCATION_STATES } from './vault-session.model';
import { assertVaultOpen, openVaultSession } from './vault.gate';

/** How long one unlock lasts. Fixed, not sliding: activity never keeps the vault open longer. */
export const VAULT_SESSION_MINUTES = 30;
const SESSION_MS = VAULT_SESSION_MINUTES * 60 * 1000;
export const VAULT_REASON_MAX = 300;

const requestLimiter = createLimiter({
  keyPrefix: 'tech_vault_code',
  points: 5,
  durationSec: 3600,
});
const verifyLimiter = createLimiter({
  keyPrefix: 'tech_vault_verify',
  points: 10,
  durationSec: 900,
});

const HISTORY_TABLE: TableConfig = {
  searchFields: ['userName', 'email', 'reason', 'ip'],
  filterFields: ['userId', 'endReason'],
  sortFields: ['unlockedAt', 'userName'],
  defaultSort: { field: 'unlockedAt', dir: 'DESC' },
};
registerTable('techVaultSessionsPaged', HISTORY_TABLE);

export interface UnlockInput {
  code: string;
  reason: string;
  location: {
    state: (typeof VAULT_LOCATION_STATES)[number];
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
  };
}

/** Ends sessions whose half hour has passed, so the history says EXPIRED rather than "open". */
const closeExpired = (userId: string) =>
  runAsPlatform(() =>
    VaultSessionModel.updateMany({ userId, endedAt: null, expiresAt: { $lte: new Date() } }, [
      { $set: { endedAt: '$expiresAt', endReason: 'EXPIRED' } },
    ]),
  );

const finite = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

function cleanLocation(location: UnlockInput['location']) {
  const latitude = finite(location.latitude);
  const longitude = finite(location.longitude);
  const valid =
    location.state === 'GRANTED' &&
    latitude !== null &&
    longitude !== null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  if (!valid) {
    return { state: location.state === 'DENIED' ? 'DENIED' : 'UNAVAILABLE' };
  }
  return { state: 'GRANTED', latitude, longitude, accuracy: finite(location.accuracy) };
}

export const vaultService = {
  /** Emails a one-time code to the address the caller is signed in with. */
  async requestCode(ctx: GraphQLContext): Promise<boolean> {
    const user = assertAuthenticated(ctx);
    await enforceLimit(requestLimiter, user.id, 'unlock codes');
    const code = await runAsPlatform(() => issueEmailCode('tech-vault', user.email));
    const profile = await runAsPlatform(() => UserModel.findById(user.id).select('name').lean());
    try {
      await emailer.send({
        template: 'tech-vault-code',
        to: user.email,
        variables: {
          name: profile?.name ?? '',
          code,
          expiresIn: EMAIL_CODE_TTL_LABEL,
          ip: ctx.ip ?? '',
          minutes: String(VAULT_SESSION_MINUTES),
        },
        triggeredBy: 'Environment Variables unlock',
      });
    } catch (error) {
      logger.error({ err: error, userId: user.id }, 'Vault unlock code failed to send');
      badRequest('We could not send the code just now. Try again in a minute.');
    }
    return true;
  },

  /** Checks the code and opens a 30-minute session, recording why, from where and on what. */
  async unlock(ctx: GraphQLContext, input: UnlockInput) {
    const user = assertAuthenticated(ctx);
    await enforceLimit(verifyLimiter, user.id, 'unlock attempts');
    const reason = input.reason.trim();
    if (reason.length < 5 || reason.length > VAULT_REASON_MAX) {
      badRequest('Say in a few words why you are opening Environment Variables.');
    }
    await runAsPlatform(() => consumeEmailCode('tech-vault', user.email, input.code));
    await closeExpired(user.id);
    const profile = await runAsPlatform(() => UserModel.findById(user.id).select('name').lean());
    const now = Date.now();
    const session = await runAsPlatform(() =>
      VaultSessionModel.create({
        userId: user.id,
        userName: profile?.name ?? '',
        email: user.email,
        reason,
        ip: ctx.ip ?? '',
        userAgent: (ctx.userAgent ?? '').slice(0, 500),
        location: cleanLocation(input.location),
        unlockedAt: new Date(now),
        expiresAt: new Date(now + SESSION_MS),
      }),
    );
    return withId(session.toObject());
  },

  /** Ends the caller's open session now. */
  async lock(ctx: GraphQLContext): Promise<boolean> {
    const user = assertAuthenticated(ctx);
    await runAsPlatform(() =>
      VaultSessionModel.updateMany(
        { userId: user.id, endedAt: null, expiresAt: { $gt: new Date() } },
        { endedAt: new Date(), endReason: 'LOCKED' },
      ),
    );
    await closeExpired(user.id);
    return true;
  },

  /** The caller's open session, or null when the vault is locked for them. */
  async status(ctx: GraphQLContext) {
    const user = assertAuthenticated(ctx);
    const session = await openVaultSession(user.id);
    return session ? withId(session) : null;
  },

  /** Refuses unless the caller has unlocked the vault in the last half hour. */
  async assertOpen(ctx: GraphQLContext): Promise<void> {
    await assertVaultOpen(assertAuthenticated(ctx).id);
  },

  /** Every unlock, newest first, for the session history. */
  history(input: TableQueryInput) {
    return runAsPlatform(() => tableQuery(VaultSessionModel, input, HISTORY_TABLE));
  },

  /** What the person did to Tech configuration while one session was open. */
  async activity(id: string) {
    const session = await runAsPlatform(() => VaultSessionModel.findById(id).lean());
    if (!session) {
      return [];
    }
    const until = session.endedAt ?? session.expiresAt;
    const rows = await runAsPlatform(() =>
      AuditLogModel.find({
        actorId: session.userId,
        module: 'TechConfig',
        createdAt: { $gte: session.unlockedAt, $lte: until },
      })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean(),
    );
    return rows.map((row) => withId(row));
  },
};
