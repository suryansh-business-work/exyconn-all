import { useCallback, useMemo } from 'react';
import { useListUsersQuery } from '@exyconn/shell/graphql/generated';

/**
 * Resolves an employee id to a display name for every HR grid that stores only the
 * id. One `listUsers` read, cached by Apollo, so the eight grids share it; an id
 * with no user (a deleted account) falls back to the id so the row is still traceable.
 */
export function useEmployeeNames(): (employeeId: string) => string {
  const { data } = useListUsersQuery();
  const nameById = useMemo(
    () => new Map((data?.listUsers ?? []).map((user) => [user.id, user.name])),
    [data],
  );
  return useCallback((employeeId: string) => nameById.get(employeeId) ?? employeeId, [nameById]);
}
