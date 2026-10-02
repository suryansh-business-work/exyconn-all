/** The search parameter that keeps the calendar's chosen accounts, comma-separated. */
export const ACCOUNTS_PARAM = 'accounts';

/** The accounts chosen in the address; none means every account. */
export const selectedAccountIds = (params: URLSearchParams): string[] =>
  (params.get(ACCOUNTS_PARAM) ?? '').split(',').filter(Boolean);

/** The address with this choice of accounts, every other parameter kept. */
export function withAccountIds(params: URLSearchParams, ids: readonly string[]): URLSearchParams {
  const next = new URLSearchParams(params);
  if (ids.length > 0) {
    next.set(ACCOUNTS_PARAM, ids.join(','));
  } else {
    next.delete(ACCOUNTS_PARAM);
  }
  return next;
}

/** The chosen accounts that are still connected: a stale link must not hide everything. */
export const connectedOnly = (
  ids: readonly string[],
  accounts: readonly { id: string }[],
): string[] => {
  const connected = new Set(accounts.map((account) => account.id));
  return ids.filter((id) => connected.has(id));
};
