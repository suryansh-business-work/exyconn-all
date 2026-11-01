import { createHash, randomBytes } from 'node:crypto';
import { isValidObjectId } from 'mongoose';
import { env } from '../../../config/env';
import type { DemoCaller } from '../../../lib/demoCaller';
import { runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { recordAudit } from '../../audit';
import { MCP_SCOPE } from '../auth/mcp.oauth';
import { McpTokenModel } from '../data/mcp.models';
import { mcpSandbox } from './sandbox.org';

const DAY_MS = 24 * 60 * 60 * 1000;
const AUDIT_MODULE = 'MCP sandbox';
/** How many of a caller's tokens the page lists. */
const LISTED_TOKENS = 10;

const hashOf = (value: string) => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('base64url');

/**
 * The connection id a caller's sandbox tokens carry: one per caller, so the sandbox's hourly
 * limit per connection is a limit per visitor, and the MCP activity log names them.
 */
const clientIdOf = (caller: DemoCaller) => `mcp-sandbox:${caller.key}`;

type TokenRow = {
  _id: unknown;
  accessExpiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
};

/** A token as its holder sees it: never the secret, which is shown once when it is made. */
export const presentToken = (row: TokenRow, now = new Date()) => ({
  id: String(row._id),
  expiresAt: row.accessExpiresAt,
  createdAt: row.createdAt,
  revokedAt: row.revokedAt ?? null,
  lastUsedAt: row.lastUsedAt ?? null,
  active: !row.revokedAt && row.accessExpiresAt > now,
});

/** An audit line in the sandbox company, under the visitor's own name. */
async function audit(
  caller: DemoCaller,
  ip: string,
  entry: { action: 'CREATE' | 'UPDATE'; entityId: unknown; summary: string },
) {
  const sandbox = await mcpSandbox();
  await runForOrganization(sandbox.organizationId, () =>
    recordAudit(
      { user: null, ip },
      {
        ...entry,
        module: AUDIT_MODULE,
        entityLabel: caller.email,
        actor: { id: caller.key, name: caller.name, email: caller.email },
      },
    ),
  );
}

/** The caller's tokens made in the last 24 hours, which the daily limit counts. */
const tokensToday = (caller: DemoCaller) =>
  runAsPlatform(() =>
    McpTokenModel.countDocuments({
      clientId: clientIdOf(caller),
      createdAt: { $gte: new Date(Date.now() - DAY_MS) },
    }),
  );

export async function tokensLeftToday(caller: DemoCaller): Promise<number> {
  return Math.max(0, env.demos.mcpSandbox.tokensPerDay - (await tokensToday(caller)));
}

/**
 * A new read-only token for the sandbox company at `/mcp/all`, good for the demo's short window
 * and never refreshable. The caller's earlier tokens are revoked: one live token per visitor.
 */
export async function issueSandboxToken(caller: DemoCaller, ip: string) {
  if ((await tokensLeftToday(caller)) === 0) {
    badRequest('You have used today’s sandbox tokens. Try again tomorrow.');
  }
  const sandbox = await mcpSandbox();
  const clientId = clientIdOf(caller);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.demos.mcpSandbox.tokenTtlMinutes * 60_000);
  const token = secret();
  const row = await runAsPlatform(async () => {
    await McpTokenModel.updateMany({ clientId, revokedAt: null }, { $set: { revokedAt: now } });
    return McpTokenModel.create({
      clientId,
      clientName: `MCP sandbox · ${caller.email}`,
      endpoint: 'all',
      userId: sandbox.accountId,
      organizationId: sandbox.organizationId,
      accessHash: hashOf(token),
      // Never handed out: the token cannot be refreshed past its window.
      refreshHash: hashOf(secret()),
      scopes: [MCP_SCOPE],
      readOnly: true,
      accessExpiresAt: expiresAt,
      refreshExpiresAt: expiresAt,
    });
  });
  await audit(caller, ip, {
    action: 'CREATE',
    entityId: row._id,
    summary: `${caller.email} took a read-only MCP sandbox token, valid until ${expiresAt.toISOString()}`,
  });
  return { token, sandboxToken: presentToken(row.toObject(), now) };
}

/** The caller's own sandbox tokens, newest first. */
export async function sandboxTokens(caller: DemoCaller) {
  const rows = await runAsPlatform(() =>
    McpTokenModel.find({ clientId: clientIdOf(caller) })
      .sort({ createdAt: -1 })
      .limit(LISTED_TOKENS)
      .lean(),
  );
  return rows.map((row) => presentToken(row));
}

/** Revokes one of the caller's own tokens at once; anybody else's is not found. */
export async function revokeSandboxToken(caller: DemoCaller, id: string, ip: string) {
  const filter = { _id: id, clientId: clientIdOf(caller) };
  const row = isValidObjectId(id)
    ? await runAsPlatform(async () => {
        await McpTokenModel.updateOne({ ...filter, revokedAt: null }, { revokedAt: new Date() });
        return McpTokenModel.findOne(filter).lean();
      })
    : null;
  if (!row) {
    notFound('Sandbox token');
  }
  await audit(caller, ip, {
    action: 'UPDATE',
    entityId: row._id,
    summary: `${caller.email} revoked an MCP sandbox token`,
  });
  return presentToken(row);
}
