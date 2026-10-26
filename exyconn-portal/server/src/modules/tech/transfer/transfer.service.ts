import { currentOrganizationId, runAsPlatform } from '../../../lib/tenant';
import { badRequest } from '../../../utils/errors';
import { isWebAddress } from '../../../utils/webAddress';
import { isKnownProvider } from '../providers/provider-guides';
import { open, seal } from '../../../utils/secretBox';
import { secretHint } from '../tech.secrets';
import { ProviderProfileModel } from '../providers/provider-profile.model';
import { kindsFor, TRANSFER_KINDS, type TransferKind } from './transfer.registry';

/** What an export file says it is; an import refuses anything else. */
export const EXPORT_FORMAT = 'exyconn-environment-variables';
export const EXPORT_VERSION = 1;
/** A whole install's configs are a few hundred kilobytes; anything far bigger is not one. */
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/** Bookkeeping never carried between installs. */
const SKIPPED = new Set([
  '_id',
  '__v',
  'id',
  'organizationId',
  'createdAt',
  'updatedAt',
  'archivedAt',
]);
/** The switch that makes a config live; imported list configs always arrive switched off. */
const ACTIVE_FIELDS = ['isActive', 'enabled'] as const;

type Row = Record<string, unknown>;

export interface ExportItem {
  section: string;
  kind: string;
  id: string;
  data: Row;
}

const run = <T>(kind: TransferKind, work: () => Promise<T>) =>
  kind.companyScoped ? work() : runAsPlatform(work);

/** A company's own config needs a company: a platform administrator above them has none. */
const reachable = (kind: TransferKind) => !kind.companyScoped || currentOrganizationId() !== null;

/** A stored row as it travels: secrets opened, hints and bookkeeping left out. */
function toPortable(kind: TransferKind, row: Row): Row {
  const data: Row = {};
  const hints = new Set(kind.secrets.map((s) => `${s.field}Hint`));
  for (const [field, value] of Object.entries(row)) {
    if (!SKIPPED.has(field) && !hints.has(field)) {
      data[field] = value;
    }
  }
  for (const { field, sealed } of kind.secrets) {
    const stored = row[field];
    data[field] = sealed && typeof stored === 'string' && stored ? open(stored) : (stored ?? '');
  }
  return data;
}

const labelOf = (row: Row) => String(row.label ?? row.key ?? row.app ?? row.name ?? row._id);

/** The configs of one section (or all), each with every field and every secret in full. */
async function exportItems(section: string | null, ids: readonly string[] | null) {
  const items: ExportItem[] = [];
  for (const [name, kind] of kindsFor(section).filter(([, k]) => reachable(k))) {
    const select = kind.secrets.map((s) => `+${s.field}`).join(' ');
    const filter = ids ? { _id: { $in: ids } } : {};
    const rows = await run(kind, () => kind.model.find(filter).select(select).lean<Row[]>().exec());
    for (const row of rows) {
      items.push({
        section: kind.section,
        kind: name,
        id: String(row._id),
        data: toPortable(kind, row),
      });
    }
  }
  const profiles = await runAsPlatform(() =>
    ProviderProfileModel.find(section ? { provider: section } : {})
      .select('+logins.password')
      .lean(),
  );
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    section: section ?? 'all',
    items,
    profiles: profiles.map((p) => ({
      provider: p.provider,
      logins: p.logins.map((l) => ({
        label: l.label,
        username: l.username,
        signInMethod: l.signInMethod,
        password: l.password ? open(l.password) : '',
        notes: l.notes,
      })),
      links: p.links.map((l) => ({ label: l.label, url: l.url, kind: l.kind })),
    })),
  };
}

/** The labels of a section's configs, for the per-item export list. */
async function itemsOf(section: string) {
  const out: Array<{ id: string; kind: string; label: string }> = [];
  for (const [name, kind] of kindsFor(section).filter(([, k]) => reachable(k))) {
    const rows = await run(kind, () => kind.model.find().lean<Row[]>().exec());
    out.push(...rows.map((row) => ({ id: String(row._id), kind: name, label: labelOf(row) })));
  }
  return out;
}

/** The stored form of one imported item: known fields only, secrets sealed with their hints. */
function toStored(kind: TransferKind, data: Row): Row {
  const paths = new Set(Object.keys(kind.model.schema.paths));
  const stored: Row = {};
  for (const [field, value] of Object.entries(data)) {
    if (paths.has(field) && !SKIPPED.has(field)) {
      stored[field] = value;
    }
  }
  for (const { field, sealed } of kind.secrets) {
    const plain = typeof data[field] === 'string' ? (data[field] as string) : '';
    stored[field] = sealed && plain ? seal(plain) : plain;
    if (paths.has(`${field}Hint`)) {
      stored[`${field}Hint`] = secretHint(plain) ?? '';
    }
  }
  return stored;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  messages: string[];
}

interface ExportProfile {
  provider: string;
  logins?: Array<Record<string, unknown>>;
  links?: Array<Record<string, unknown>>;
}

function parseFile(json: string): { items: ExportItem[]; profiles: ExportProfile[] } {
  if (Buffer.byteLength(json, 'utf8') > MAX_IMPORT_BYTES) {
    badRequest('That file is too large to be an Environment Variables export.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    badRequest('That file is not valid JSON.');
  }
  const file = parsed as {
    format?: unknown;
    version?: unknown;
    items?: unknown;
    profiles?: unknown;
  };
  if (
    file?.format !== EXPORT_FORMAT ||
    file.version !== EXPORT_VERSION ||
    !Array.isArray(file.items)
  ) {
    badRequest('That file is not an Environment Variables export (format version 1).');
  }
  const profiles = Array.isArray(file.profiles) ? (file.profiles as ExportProfile[]) : [];
  return { items: file.items as ExportItem[], profiles };
}

/** Adds one item: a singleton is updated in place (keeping its switch), a list item added off. */
async function importItem(kind: TransferKind, data: Row, result: ImportResult) {
  const stored = toStored(kind, data);
  const key = kind.keyField ? stored[kind.keyField] : undefined;
  if (kind.keyField && typeof key === 'string' && key) {
    for (const field of ACTIVE_FIELDS) {
      delete stored[field];
    }
    const existing = await run(kind, () => kind.model.exists({ [kind.keyField as string]: key }));
    await run(kind, () =>
      kind.model.updateOne(
        { [kind.keyField as string]: key },
        { $set: stored },
        { upsert: true, runValidators: true },
      ),
    );
    result[existing ? 'updated' : 'created'] += 1;
    return;
  }
  for (const field of ACTIVE_FIELDS) {
    if (kind.model.schema.path(field)) {
      stored[field] = false;
    }
  }
  await run(kind, () => kind.model.create(stored));
  result.created += 1;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Adds the logins and links a provider does not have yet (by account name and address). */
async function importProfile(profile: ExportProfile, result: ImportResult) {
  const doc = await runAsPlatform(() =>
    ProviderProfileModel.findOneAndUpdate(
      { provider: profile.provider },
      { $setOnInsert: { provider: profile.provider } },
      { upsert: true, new: true },
    ).select('+logins.password'),
  );
  const labels = new Set(doc.logins.map((l) => l.label));
  const urls = new Set(doc.links.map((l) => l.url));
  for (const login of profile.logins ?? []) {
    const label = text(login.label).trim();
    if (label && !labels.has(label)) {
      const password = text(login.password);
      doc.logins.push({
        label,
        username: text(login.username),
        signInMethod: text(login.signInMethod) || 'OTHER',
        notes: text(login.notes),
        ...(password ? { password: seal(password), passwordHint: '••••••••' } : {}),
      });
      result.created += 1;
    }
  }
  for (const link of profile.links ?? []) {
    const url = text(link.url).trim();
    if (url && !urls.has(url) && isWebAddress(url)) {
      doc.links.push({ label: text(link.label) || url, url, kind: text(link.kind) || 'OTHER' });
      result.created += 1;
    }
  }
  await runAsPlatform(() => doc.save());
}

/** Imports a file into one section (or everywhere); every item is checked before it is written. */
async function importFile(section: string | null, json: string): Promise<ImportResult> {
  const { items, profiles } = parseFile(json);
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, messages: [] };
  for (const item of items) {
    const kind = TRANSFER_KINDS.get(String(item?.kind));
    const where = `${String(item?.kind)} ${labelOf(item?.data ?? {})}`;
    if (
      !kind ||
      (section && kind.section !== section) ||
      typeof item.data !== 'object' ||
      !item.data
    ) {
      result.skipped += 1;
      result.messages.push(`Skipped ${where}: it does not belong here.`);
      continue;
    }
    try {
      await importItem(kind, item.data, result);
    } catch (error) {
      result.skipped += 1;
      result.messages.push(
        `Skipped ${where}: ${error instanceof Error ? error.message : 'invalid'}`,
      );
    }
  }
  for (const profile of profiles) {
    if (
      typeof profile?.provider !== 'string' ||
      !isKnownProvider(profile.provider) ||
      (section && profile.provider !== section)
    ) {
      continue;
    }
    try {
      await importProfile(profile, result);
    } catch (error) {
      result.messages.push(
        `Skipped the ${profile.provider} logins and links: ${error instanceof Error ? error.message : 'invalid'}`,
      );
    }
  }
  return result;
}

export const transferService = { exportItems, itemsOf, importFile };
