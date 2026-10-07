import type { ApolloClient } from '@apollo/client';
import type { DocumentNode } from 'graphql';
import { vi } from 'vitest';

export interface QueryOptions {
  query: DocumentNode;
  variables?: { input?: { page: number; pageSize: number } };
}

type Answer = (options: QueryOptions) => unknown;

/**
 * An Apollo client whose `query` answers from a list of documents and data builders, so a
 * report's loader can be run without a server. A document with no answer resolves to no data.
 */
export function fakeClient(answers: ReadonlyArray<readonly [DocumentNode, Answer]> = []) {
  const byDocument = new Map(answers);
  const query = vi.fn((options: QueryOptions) =>
    Promise.resolve({ data: byDocument.get(options.query)?.(options) }),
  );
  return { client: { query } as unknown as ApolloClient, query };
}

/** One page of a paged list, cut from `rows` the way the server pages (1-based). */
export function pageOf<Row>(rows: Row[], options: QueryOptions, totalCount = rows.length) {
  const { page, pageSize } = options.variables?.input ?? { page: 1, pageSize: rows.length };
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), totalCount };
}
