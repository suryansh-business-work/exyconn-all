import { useCallback } from 'react';
import { useMyPermissionsQuery } from '@/graphql/generated';

/** One column of the admin permission matrix, as `myPermissions` returns it. */
export type PermissionActionKey = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

/**
 * What the signed-in user may do in each module, so a screen never offers a button
 * the server would refuse.
 *
 * Permissive by default: a module with no restriction row, a module the server does
 * not know, and the moment before the query resolves all answer `true`. That matches
 * the server's own rule — a missing row means "allowed" — and keeps buttons from
 * flickering off and back on while the matrix loads. The server is still the
 * authority; this only decides what is worth showing.
 */
export function usePermissions() {
  const { data, loading } = useMyPermissionsQuery({ fetchPolicy: 'cache-first' });
  const rows = data?.myPermissions;

  const can = useCallback(
    (module: string, action: PermissionActionKey): boolean =>
      rows?.find((row) => row.module === module)?.[action] ?? true,
    [rows],
  );

  return { can, loading };
}
