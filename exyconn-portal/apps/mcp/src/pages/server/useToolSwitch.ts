import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useMcpSettingsQuery,
  useUpdateMcpSettingsMutation,
} from '@exyconn/shell/graphql/generated';

/**
 * Switching one tool off or on for the whole company (admins only): the tool's name is added to
 * or taken out of the settings' switched-off list, which the server checks on every call.
 * `canSwitch` is false for everyone else, who only see whether a tool is on.
 */
export function useToolSwitch(onChanged: () => Promise<unknown>) {
  const notify = useNotify();
  const { user } = useAuth();
  const canSwitch = Boolean(user?.roles.includes(ROLES.ADMIN));
  const { data } = useMcpSettingsQuery({ skip: !canSwitch });
  const [save, { loading }] = useUpdateMcpSettingsMutation();

  const setEnabled = async (tool: string, enabled: boolean) => {
    const current = data?.mcpSettings.disabledTools ?? [];
    const disabledTools = enabled
      ? current.filter((name) => name !== tool)
      : [...new Set([...current, tool])];
    try {
      await save({ variables: { input: { disabledTools } } });
      await onChanged();
      notify(enabled ? 'Tool switched on' : 'Tool switched off');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change the tool', 'error');
    }
  };

  return { canSwitch: canSwitch && Boolean(data), busy: loading, setEnabled };
}
