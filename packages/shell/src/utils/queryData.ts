/**
 * The data from a completed Apollo query.
 *
 * Apollo 4 types `data` as optional, because a query can finish with errors and only part
 * of a result. Under the default error policy Apollo throws rather than returning that, so
 * an absent `data` here is not a case a caller can recover from — it means the contract
 * changed. Saying so out loud beats a `!` that turns it into a later "cannot read property
 * of undefined" somewhere else.
 */
export function queryData<T>(result: { data?: T }, operation: string): T {
  if (result.data === undefined) {
    throw new Error(`${operation} returned no data`);
  }
  return result.data;
}
