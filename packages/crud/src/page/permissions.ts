import type { PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';

/** The row-action keys the shared column factories reserve for edit and delete. */
const GUARDED_ACTIONS: { key: string; action: PermissionActionKey }[] = [
  { key: 'edit', action: 'edit' },
  { key: 'delete', action: 'delete' },
];

/**
 * The row-action keys the viewer may not use.
 *
 * The grid resolves an action's handler out of the context by key and renders nothing
 * when it is missing, so removing the key is what removes the button — the column model
 * itself stays a module-level constant.
 */
export function deniedActionKeys(can: (action: PermissionActionKey) => boolean): string[] {
  return GUARDED_ACTIONS.filter((entry) => !can(entry.action)).map((entry) => entry.key);
}

/** The page's grid context with those handlers taken out. Returns it unchanged when none are. */
export function contextWithoutActions<TContext extends object>(
  context: TContext,
  denied: readonly string[],
): TContext {
  const { actions } = context as { actions?: Record<string, unknown> };
  if (!actions || denied.length === 0) {
    return context;
  }
  const kept = Object.entries(actions).filter(([key]) => !denied.includes(key));
  return { ...context, actions: Object.fromEntries(kept) };
}

/**
 * Refuses an export before it reads its first page.
 *
 * An export is served by the module's own paged list resolver, so EXPORT has no request
 * of its own for the server to guard — `canExport` is that request, asked once here.
 */
export async function assertExportAllowed(
  check: (module: string) => Promise<boolean>,
  module: string,
): Promise<void> {
  if (!(await check(module))) {
    throw new Error('Your role may not export this data.');
  }
}
