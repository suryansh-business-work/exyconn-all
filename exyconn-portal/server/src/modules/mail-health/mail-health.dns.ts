import { Resolver } from 'node:dns/promises';

/** A name that does not exist, or exists without records of the type asked for. */
const NO_RECORDS = new Set(['ENODATA', 'ENOTFOUND']);

const resolver = () => new Resolver({ timeout: 5000, tries: 2 });

const isNoRecords = (error: unknown) =>
  NO_RECORDS.has((error as NodeJS.ErrnoException | undefined)?.code ?? '');

/** Every TXT record on a name, each joined from its strings; [] when there are none. */
export async function txtRecords(name: string): Promise<string[]> {
  try {
    const rows = await resolver().resolveTxt(name);
    return rows.map((parts) => parts.join(''));
  } catch (error) {
    if (isNoRecords(error)) return [];
    throw error;
  }
}

/** The domain's mail servers, by priority; [] when it has none. */
export async function mxHosts(domain: string): Promise<string[]> {
  try {
    const rows = await resolver().resolveMx(domain);
    rows.sort((a, b) => a.priority - b.priority);
    return rows.map((row) => row.exchange);
  } catch (error) {
    if (isNoRecords(error)) return [];
    throw error;
  }
}

/** The A records on a name; [] when it does not exist — which is how a blocklist says "not listed". */
export async function aRecords(name: string): Promise<string[]> {
  try {
    return await resolver().resolve4(name);
  } catch (error) {
    if (isNoRecords(error)) return [];
    throw error;
  }
}
