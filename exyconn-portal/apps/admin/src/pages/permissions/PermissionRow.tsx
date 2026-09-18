import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Chip,
  Flex,
  FormControlLabel,
  Switch,
  Text,
} from '@exyconn/shell/components/ui';
import { PermissionAction } from '@exyconn/shell/graphql/generated';

export const ACTIONS = Object.values(PermissionAction);

interface PermissionRowProps {
  module: string;
  /** Undefined = no restriction row = the role may do everything. */
  saved: PermissionAction[] | undefined;
  onSave: (actions: PermissionAction[]) => Promise<void>;
  onReset: () => Promise<void>;
}

/** One module for the selected role: six switches, save, or reset to the default. */
export function PermissionRow({ module, saved, onSave, onReset }: Readonly<PermissionRowProps>) {
  const t = useT();
  const [draft, setDraft] = useState<PermissionAction[]>(saved ?? ACTIONS);
  const [busy, setBusy] = useState(false);
  const restricted = saved !== undefined;
  const dirty = restricted
    ? [...draft].sort().join() !== [...saved].sort().join()
    : draft.length !== ACTIONS.length;

  const toggle = (action: PermissionAction) =>
    setDraft((d) => (d.includes(action) ? d.filter((a) => a !== action) : [...d, action]));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Flex
      // A row is a module, six switches and two buttons. Side by side on a desk; on a phone
      // that wrapped into a tower nobody could read as a row at all, so it becomes a stack
      // with the module's name over its own switches.
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={2}
      wrap
      sx={{ py: 1 }}
    >
      {/* A fixed column, so every row's switches line up however long the module's name. */}
      <Box sx={{ width: { md: 200 }, flexShrink: 0 }}>
        <Text component="div" weight="medium" sx={{ overflowWrap: 'anywhere' }}>
          {module}
        </Text>
        <Chip
          size="small"
          label={restricted ? t('Restricted') : t('Default (all)')}
          color={restricted ? 'warning' : 'default'}
          variant="outlined"
          sx={{ mt: 0.5 }}
        />
      </Box>
      <Flex direction="row" wrap flexGrow={1} sx={{ rowGap: 1 }}>
        {ACTIONS.map((action) => (
          <FormControlLabel
            key={action}
            control={
              <Switch
                size="small"
                checked={draft.includes(action)}
                onChange={() => toggle(action)}
              />
            }
            label={action.charAt(0) + action.slice(1).toLowerCase()}
          />
        ))}
      </Flex>
      <Flex direction="row" spacing={1} justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
        <Button size="small" disabled={busy || !dirty} onClick={() => run(() => onSave(draft))}>
          {t('Save')}
        </Button>
        <Button
          size="small"
          variant="text"
          disabled={busy || !restricted}
          onClick={() => run(onReset).then(() => setDraft(ACTIONS))}
        >
          {t('Reset to default')}
        </Button>
      </Flex>
    </Flex>
  );
}
