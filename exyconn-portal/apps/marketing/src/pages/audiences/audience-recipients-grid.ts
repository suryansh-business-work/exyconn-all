import type { ColDef } from 'ag-grid-community';
import {
  derivedColumn,
  derivedStatusColumn,
  emailColumn,
  textColumn,
} from '@exyconn/crud';
import type { AudienceRecipientFieldsFragment } from '@exyconn/shell/graphql/generated';

export type RecipientRow = AudienceRecipientFieldsFragment;

/** "CONTACT · RULES" for each record behind the address. */
const sourcesOf = (row: RecipientRow): string =>
  row.sources.map((source) => `${source.kind} · ${source.via}`).join(', ');

/**
 * The recipient preview: one row per unique address, every record behind it, and — when it
 * will not be sent to — why not.
 */
export const RECIPIENT_COLUMNS: ColDef<RecipientRow>[] = [
  emailColumn('email', 'Email'),
  textColumn('name', 'Contact', (row) => row.name || '—'),
  textColumn('company', 'Company', (row) => row.company || '—'),
  textColumn('label', 'Email type', (row) => row.label || '—'),
  derivedStatusColumn('verification', 'Validation status', (row) => row.verification),
  derivedColumn('sources', 'Source', sourcesOf),
  derivedStatusColumn('exclusion', 'Status', (row) => row.exclusion ?? 'ELIGIBLE'),
];
