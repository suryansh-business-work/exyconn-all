import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { currentOrganizationId } from '../../../lib/tenant';
import { badRequest } from '../../../utils/errors';
import { MCP_SERVERS } from '../servers';

/** The most calls an hour any limit may allow; 0 means no limit. */
export const MAX_CALLS_PER_HOUR = 100_000;

/**
 * The company's MCP settings, edited by an admin on the MCP portal's Settings page: how many
 * calls an hour a person, a connection and a person's changes may make, which tools are off,
 * which servers only read, and when to raise an alert.
 */
const mcpSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    /** Calls a person may make an hour, across every connection; 0 is no limit. */
    callsPerHourPerPerson: { type: Number, default: 0, min: 0, max: MAX_CALLS_PER_HOUR },
    /** Calls one connection (one Claude client for one person) may make an hour; 0 is no limit. */
    callsPerHourPerConnection: { type: Number, default: 0, min: 0, max: MAX_CALLS_PER_HOUR },
    /** Changes (mutations) a person may make an hour; 0 is no limit. */
    writesPerHourPerPerson: { type: Number, default: 0, min: 0, max: MAX_CALLS_PER_HOUR },
    /** Tools nobody in the company can call through MCP, by name. */
    disabledTools: { type: [String], default: [] },
    /** Module servers whose tools only read: their changes are not offered. */
    readOnlyServers: { type: [String], enum: MCP_SERVERS.map((spec) => spec.key), default: [] },
    alertsEnabled: { type: Boolean, default: false },
    /** Alert when this share of the last hour's calls failed, 1–100. */
    alertErrorRatePercent: { type: Number, default: 20, min: 1, max: 100 },
    /** Alert when the last hour's p95 call time is over this, in milliseconds. */
    alertP95Ms: { type: Number, default: 10_000, min: 100, max: 600_000 },
    /** No alert below this many calls in the hour, so one failure is not a 100% error rate. */
    alertMinCalls: { type: Number, default: 20, min: 1, max: 100_000 },
    /** The Slack channel alerts go to, by id; '' sends them to admins' notifications only. */
    alertSlackChannel: { type: String, default: '' },
    /** A daily summary of the day's calls, failures and slowest tools, to the same places. */
    dailyDigest: { type: Boolean, default: false },
    /** When the last alert went out, so one problem raises one alert an hour, not one a minute. */
    lastAlertAt: { type: Date, default: null },
    /** The UTC day the last digest covered. */
    lastDigestDay: { type: String, default: '' },
  },
  { timestamps: true },
);

export type McpSettingsDocument = InferSchemaType<typeof mcpSettingsSchema>;
export const McpSettingsModel: Model<McpSettingsDocument> = model<McpSettingsDocument>(
  'McpSettings',
  mcpSettingsSchema,
);

/** The settings a company has before an admin changes any. */
export const MCP_SETTINGS_DEFAULTS = {
  callsPerHourPerPerson: 0,
  callsPerHourPerConnection: 0,
  writesPerHourPerPerson: 0,
  disabledTools: [] as string[],
  readOnlyServers: [] as string[],
  alertsEnabled: false,
  alertErrorRatePercent: 20,
  alertP95Ms: 10_000,
  alertMinCalls: 20,
  alertSlackChannel: '',
  dailyDigest: false,
  lastAlertAt: null as Date | null,
  lastDigestDay: '',
};

export type McpSettings = typeof MCP_SETTINGS_DEFAULTS;
/** What an admin may change: everything but the alert and digest bookkeeping. */
export type McpSettingsInput = Partial<Omit<McpSettings, 'lastAlertAt' | 'lastDigestDay'>>;

/** How long a company's settings are reused before they are read again, in milliseconds. */
const CACHE_MS = 15_000;
const cache = new Map<string, { at: number; settings: McpSettings }>();

/**
 * The company's settings, defaults under whatever is stored (a lean read skips defaults, so a
 * row written before a field existed still reads whole). Every MCP call reads them, so they are
 * kept for a few seconds per company; saving clears that at once.
 */
export async function mcpSettings(): Promise<McpSettings> {
  const organizationId = currentOrganizationId() ?? '';
  const hit = cache.get(organizationId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.settings;
  const stored = await McpSettingsModel.findOne({ key: 'global' }).lean();
  const settings = { ...MCP_SETTINGS_DEFAULTS, ...stored } as McpSettings;
  cache.set(organizationId, { at: Date.now(), settings });
  return settings;
}

const SERVER_KEYS = new Set<string>(MCP_SERVERS.map((spec) => spec.key));

function assertLimit(value: number | undefined, name: string): void {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0 || value > MAX_CALLS_PER_HOUR) {
    badRequest(`${name} must be a whole number from 0 (no limit) to ${MAX_CALLS_PER_HOUR}.`);
  }
}

/** Checks what an admin sent before it is saved; the schema's bounds back this up. */
function assertInput(input: McpSettingsInput): void {
  assertLimit(input.callsPerHourPerPerson, 'Calls an hour per person');
  assertLimit(input.callsPerHourPerConnection, 'Calls an hour per connection');
  assertLimit(input.writesPerHourPerPerson, 'Changes an hour per person');
  const unknown = (input.readOnlyServers ?? []).filter((key) => !SERVER_KEYS.has(key));
  if (unknown.length > 0) badRequest(`Unknown MCP server: ${unknown.join(', ')}`);
}

/** Saves the company's settings and drops the cached copy, so the next call obeys them. */
export async function updateMcpSettings(input: McpSettingsInput): Promise<McpSettings> {
  assertInput(input);
  const updated = await McpSettingsModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  }).lean();
  cache.delete(currentOrganizationId() ?? '');
  return { ...MCP_SETTINGS_DEFAULTS, ...updated } as McpSettings;
}

/** Notes when an alert or a digest went out (the loop's own bookkeeping). */
export async function markMcpSettings(
  change: Partial<Pick<McpSettings, 'lastAlertAt' | 'lastDigestDay'>>,
): Promise<void> {
  await McpSettingsModel.updateOne({ key: 'global' }, { $set: change });
  cache.delete(currentOrganizationId() ?? '');
}
