import { useMemo, useState } from 'react';
import { Box, Divider, Tab, Tabs, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ROLES } from '@exyconn/shell/auth/roles';
import {
  Role,
  type PermissionAction,
  useListPermissionModulesQuery,
  useListRolePermissionsQuery,
  useSetRolePermissionMutation,
  useClearRolePermissionMutation,
} from '@exyconn/shell/graphql/generated';
import { PermissionRow } from './PermissionRow';

/** ADMIN can never be restricted, so it is not offered. */
const RESTRICTABLE_ROLES = Object.values(Role).filter((r) => r !== ROLES.ADMIN);

/**
 * Roles & permissions matrix. Pick a role; every module shows what that role may
 * do there. Nothing is restricted until you save a row, so the portal behaves
 * exactly as before until an administrator decides otherwise.
 */
export function PermissionsPage() {
  const [role, setRole] = useState<Role>(RESTRICTABLE_ROLES[0]);
  const notify = useNotify();
  const modules = useListPermissionModulesQuery({ fetchPolicy: 'cache-and-network' });
  const rows = useListRolePermissionsQuery({ fetchPolicy: 'cache-and-network' });
  const [setPermission] = useSetRolePermissionMutation();
  const [clearPermission] = useClearRolePermissionMutation();

  const savedFor = useMemo(() => {
    const map = new Map<string, PermissionAction[]>();
    for (const r of rows.data?.listRolePermissions ?? [])
      if (r.role === role) map.set(r.module, r.actions);
    return map;
  }, [rows.data, role]);

  const save = async (module: string, actions: PermissionAction[]) => {
    try {
      await setPermission({ variables: { role, module, actions } });
      notify(
        `${role} on ${module}: ${actions.length ? actions.join(', ') : 'no access'}`,
        'success',
      );
      await rows.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save', 'error');
    }
  };
  const reset = async (module: string) => {
    try {
      await clearPermission({ variables: { role, module } });
      notify(`${role} on ${module}: back to default`, 'success');
      await rows.refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not reset', 'error');
    }
  };

  const moduleNames = modules.data?.listPermissionModules ?? [];

  return (
    <Box>
      <PageHeader title="Roles & Permissions" subtitle="What each role may do in each module" />
      <Box sx={[glass, { p: { xs: 1, md: 2 } }]}>
        <Tabs
          value={role}
          onChange={(_e, v: Role) => setRole(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1 }}
        >
          {RESTRICTABLE_ROLES.map((r) => (
            <Tab key={r} value={r} label={r} />
          ))}
        </Tabs>
        <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
          A module only appears for roles that can already open it; ADMIN always has everything.
          "Default" means the role can do everything in that module — save a row to restrict it,
          reset to go back.
        </Text>
        <Divider />
        {moduleNames.length === 0 && (
          <Text size="sm" color="text.secondary" sx={{ py: 2 }}>
            {modules.loading ? 'Loading…' : 'No modules registered.'}
          </Text>
        )}
        {moduleNames.map((module) => (
          <Box key={`${role}:${module}`}>
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
    </Box>
  );
}
