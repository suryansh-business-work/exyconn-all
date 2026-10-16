import { vi } from 'vitest';
import type { MockLink } from '@apollo/client/testing';
import { ParseTableFileDocument, TableFileFormat } from '@exyconn/shell/graphql/generated';
import type { ImportChunkResult, ImportSource } from '../../../src/import/import.types';

export type Mode = 'UPSERT' | 'CREATE';

/** A typed spy for a source's chunk writer. */
export const chunkSpy = (impl: ImportSource<Mode>['runChunk']) => vi.fn(impl);

export const leadFields = [
  { key: 'name', label: 'Company', required: true, group: 'Built-in', typeLabel: 'Text' },
  { key: 'email', label: 'Email', required: true, group: 'Built-in', aliases: ['Mail'] },
  { key: 'tier', label: 'Tier', required: false, group: 'Custom' },
];

export const okChunk = (overrides: Partial<ImportChunkResult> = {}): ImportChunkResult => ({
  created: 1,
  updated: 0,
  skipped: 0,
  issues: [],
  ...overrides,
});

/** A lead import source whose writes and sample download are spies. */
export const leadSource = (overrides: Partial<ImportSource<Mode>> = {}): ImportSource<Mode> => ({
  title: 'Import leads',
  fields: leadFields,
  modes: [
    { mode: 'UPSERT', label: 'Create new and update existing' },
    { mode: 'CREATE', label: 'Create new only' },
  ],
  matchLabel: 'Email',
  synonyms: { organisation: 'name' },
  runChunk: vi.fn(() => Promise.resolve(okChunk())),
  templateFormats: [TableFileFormat.Csv, TableFileFormat.Xlsx],
  downloadTemplate: vi.fn(() => Promise.resolve()),
  ...overrides,
});

export const FILE_TEXT = 'Organisation,Mail,Notes';

/** The file a test uploads; its text is what the server mock expects in base64. */
export const csvFile = (name = 'leads.csv', text = FILE_TEXT) =>
  new File([text], name, { type: 'text/csv' });

/** The server reading `csvFile()` back as a header row and data rows. */
export const parseMock = (
  rows: string[][],
  headers: string[] = ['Organisation', 'Mail', 'Notes'],
  name = 'leads.csv',
  text = FILE_TEXT,
): MockLink.MockedResponse => ({
  request: {
    query: ParseTableFileDocument,
    variables: { fileName: name, contentBase64: globalThis.btoa(text) },
  },
  result: { data: { parseTableFile: { __typename: 'ParsedTableFile', headers, rows } } },
});

/** A promise the test settles by hand, to hold a chunk in flight. */
export function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
