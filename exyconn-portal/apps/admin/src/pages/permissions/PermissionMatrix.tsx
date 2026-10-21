import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  Role,
  type PermissionAction,
  useListPermissionModulesQuery,
  useListRolePermissionsQuery,
  useSetRolePermissionMutation,
  useClearRolePermissionMutation,
} from '@exyconn/shell/graphql/generated';
import { saveOperation } from './permissions.logic';
import { usePermissionDraft } from './usePermissionDraft';
import { PermissionTable } from './PermissionTable';
import { PermissionSaveBar } from './PermissionSaveBar';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { inSequence } from '@exyconn/shell/utils/inSequence';

/** What one role may do in every module: a matrix edited in place and saved in one go. */
export function PermissionMatrix({ role }: Readonly<{ role: Role }>) {
  const t = useT();
  const notify = useNotify();
  const modules = useListPermissionModulesQuery({ fetchPolicy: 'cache-and-network' });
  const rows = useListRolePermissionsQuery({ fetchPolicy: 'cache-and-network' });
  const [setPermission] = useSetRolePermissionMutation();
  const [clearPermission] = useClearRolePermissionMutation();
  const [busy, setBusy] = useState(false);

  const saved = useMemo(() => {
    const map = new Map<string, PermissionAction[]>();
    for (const r of rows.data?.listRolePermissions ?? []) {
      if (r.role === role) map.set(r.module, r.actions);
    }
    return map;
  }, [rows.data, role]);
  const moduleNames = modules.data?.listPermissionModules ?? [];
  const draft = usePermissionDraft(moduleNames, saved);

  const store = (module: string, actions: readonly PermissionAction[]) =>
    saveOperation(actions) === 'reset'
      ? clearPermission({ variables: { role, module } })
      : setPermission({ variables: { role, module, actions: [...actions] } });

  /** Saves each changed module in turn; whatever saved stays saved if a later one fails. */
  const saveAll = async () => {
    setBusy(true);
    const done: string[] = [];
    try {
      await inSequence([...draft.dirty], async (module) => {
        await store(module, draft.current(module));
        done.push(module);
      });
      notify('Saved {count} module(s) for {role}', 'success', { count: done.length, role });
    } catch (error) {
      notify(errorMessage(error, 'Could not save'), 'error');
    } finally {
      await rows.refetch();
      done.forEach((module) => draft.forget(module));
      setBusy(false);
    }
  };

  /** An unexpected failure (a reload that itself fails): logged, and the matrix unlocked. */
  const logFailure = (what: string) => (error: unknown) => {
    portalLogger.error(what, error);
    setBusy(false);
  };

  const reset = async (module: string) => {
    setBusy(true);
    try {
      await clearPermission({ variables: { role, module } });
      await rows.refetch();
      draft.forget(module);
      notify('{role} on {module}: back to default', 'success', { role, module });
    } catch (error) {
      notify(errorMessage(error, 'Could not reset'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (moduleNames.length === 0 && modules.loading) {
    return <ListSkeleton toolbar={false} columns={5} label="Loading modules" />;
  }
  if (moduleNames.length === 0) {
    return (
      <Flex direction="row" alignItems="center" spacing={1} sx={{ py: 3, px: 2 }}>
        <Text size="sm" color="text.secondary">
          {t('No modules registered.')}
        </Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Text component="p" size="sm" color="text.secondary" sx={{ px: 2, pb: 1 }}>
        {t(
          'A module appears only for roles that can already open it; ADMIN always has everything. “Default” means the role can do everything there — untick an action to restrict it, or tick a column heading to change that action in every module.',
        )}
      </Text>
      <PermissionTable
        role={role}
        modules={moduleNames}
        draft={draft}
        isRestricted={(module) => saved.has(module)}
        busy={busy}
        onReset={(module) => {
          reset(module).catch(logFailure('Resetting a permission failed'));
        }}
      />
      <PermissionSaveBar
        count={draft.dirty.length}
        busy={busy}
        onSave={() => {
          saveAll().catch(logFailure('Saving permissions failed'));
        }}
        onDiscard={draft.discard}
      />
    </Box>
  );
}
