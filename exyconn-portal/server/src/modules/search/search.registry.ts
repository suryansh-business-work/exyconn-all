import { ROLES, type Role } from '../../constants/roles';

/** One thing somebody can jump to from the search box. */
export interface SearchHit {
  /** Stable id of the record, so the palette can key a list on it. */
  id: string;
  /** What the record is called: "EXY-14", "INV-0042", "Asha Rao". */
  title: string;
  /** One line of context — the company, the status, who it is assigned to. */
  subtitle: string;
  /** Where in the portal it opens, including the app's path prefix. */
  link: string;
}

/** One module's answer to "what of ours matches this?" */
export interface SearchProvider {
  /** Stable key, also the group's id on screen. */
  key: string;
  /** What the group is called: "Invoices", "People", "Tickets". */
  label: string;
  /**
   * Who may search this at all.
   *
   * The same roles that guard the module's own screens, because a search box must never
   * become a way to read a module somebody cannot open. ADMIN passes everything, as it does
   * everywhere else.
   */
  roles: Role[];
  find(query: string, limit: number): Promise<SearchHit[]>;
}

const providers: SearchProvider[] = [];

/**
 * Registers a provider. Called from the module that owns the records, at import time — the
 * same shape the reminder sources use, so a module adds one call in its own folder.
 */
export function registerSearchProvider(provider: SearchProvider): void {
  if (providers.some((existing) => existing.key === provider.key)) {
    throw new Error(`Two search providers are registered as "${provider.key}"`);
  }
  providers.push(provider);
}

export function searchProviders(): readonly SearchProvider[] {
  return providers;
}

/** Drops every provider — used by tests that register their own. */
export function clearSearchProviders(): void {
  providers.length = 0;
}

/** The providers this caller's roles reach. */
export function providersFor(roles: readonly Role[]): SearchProvider[] {
  if (roles.includes(ROLES.ADMIN)) {
    return [...providers];
  }
  return providers.filter((provider) => provider.roles.some((role) => roles.includes(role)));
}
