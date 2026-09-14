import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Divider, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  Role,
  type PermissionAction,
  useListPermissionModulesQuery,
  useListRolePermissionsQuery,
  useSetRolePermissionMutation,
  useClearRolePermissionMutation,
} from '@exyconn/shell/graphql/generated';
import { PermissionRow } from './PermissionRow';

/** What one role may do in every module, one row per module. */
export function PermissionMatrix({ role }: Readonly<{ role: Role }>) {
  const t = useT();
  const notify = useNotify();
  const modules = useListPermissionModulesQuery({ fetchPolicy: 'cache-and-network' });
  const rows = useListRolePermissionsQuery({ fetchPolicy: 'cache-and-network' });
  const [setPermission] = useSetRolePermissionMutation();
  const [clearPermission] = useClearRolePermissionMutation();

  const savedFor = useMemo(() => {
    const map = new Map<string, PermissionAction[]>();
    for (const r of rows.data?.listRolePermissions ?? []) {
      if (r.role === role) map.set(r.module, r.actions);
    }
    return map;
  }, [rows.data, role]);

  const save = async (module: string, actions: PermissionAction[]) => {
    try {
      await setPermission({ variables: { role, module, actions } });
      const summary = actions.length > 0 ? actions.join(', ') : t('no access');
      notify('{role} on {module}: {summary}', 'success', { role, module, summary });
      await rows.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save', 'error');
    }
  };

  const reset = async (module: string) => {
    try {
      await clearPermission({ variables: { role, module } });
      notify('{role} on {module}: back to default', 'success', { role, module });
      await rows.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not reset', 'error');
    }
  };

  const moduleNames = modules.data?.listPermissionModules ?? [];

  return (
    <Box>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t(
          'A module only appears for roles that can already open it; ADMIN always has everything. “Default” means the role can do everything in that module — save a row to restrict it, reset to go back.',
        )}
      </Text>
      <Divider />
      {moduleNames.length === 0 && (
        <Text size="sm" color="text.secondary" sx={{ py: 2 }}>
          {modules.loading ? t('Loading…') : t('No modules registered.')}
        </Text>
      )}
      {moduleNames.map((module) => (
        <Box key={module}>
          <PermissionRow
            module={module}
            saved={savedFor.get(module)}
            onSave={(a) => save(module, a)}
            onReset={() => reset(module)}
          />
          <Divider />
        </Box>
      ))}
    </Box>
  );
}
