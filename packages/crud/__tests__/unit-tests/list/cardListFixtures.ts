import { vi } from 'vitest';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import { dateColumn, textColumn } from '../../../src/grid/columns';

export interface Lead {
  id?: string;
  name: string;
  createdAt: string;
}

export const lead = (n: number, withId = true): Lead => ({
  ...(withId ? { id: `lead-${n}` } : {}),
  name: `Lead ${n}`,
  createdAt: '2026-10-02',
});

export const leadColumns = [
  textColumn<Lead>('name', 'Name'),
  dateColumn<Lead>('createdAt', 'Created'),
];

/** A promise the test settles by hand, to hold a request in flight. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

export type FetchLeads = (input: TableQueryInput) => Promise<TablePageResult<Lead>>;

/** A fetcher that answers every request with the given page. */
export const answering = (rows: Lead[], totalCount: number) =>
  vi.fn<FetchLeads>(() => Promise.resolve({ rows, totalCount }));
