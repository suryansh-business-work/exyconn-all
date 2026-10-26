import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Who a request is for and which site sent it, readable from anywhere the request reaches —
 * so the integration meter can say which person on which portal caused a paid call without
 * every client passing it down. Kept apart from the tenant scope, which is about data access.
 */
export interface RequestInfo {
  actorId: string;
  actorEmail: string;
  /** The `Origin` header: the portal or site the call came from; '' for server-to-server. */
  origin: string;
  /** The server path, e.g. /graphql or a webhook. */
  path: string;
}

const storage = new AsyncLocalStorage<RequestInfo>();

/** Opens the store around one request (see middleware/requestInfo.ts). */
export function runWithRequestInfo<T>(info: RequestInfo, fn: () => T): T {
  return storage.run(info, fn);
}

/** The current request's info, or undefined for a background job. */
export const currentRequestInfo = (): RequestInfo | undefined => storage.getStore();

/** Records the caller once the request has identified them. */
export function setRequestActor(actorId: string, actorEmail: string): void {
  const info = storage.getStore();
  if (info) {
    info.actorId = actorId;
    info.actorEmail = actorEmail;
  }
}
