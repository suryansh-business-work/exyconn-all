import { useState } from 'react';
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
    <Flex direction="row" alignItems="center" spacing={2} sx={{ py: 1, flexWrap: 'wrap' }}>
      <Box sx={{ minWidth: 180 }}>
        <Text weight="medium">{module}</Text>
        <Chip
          size="small"
          label={restricted ? 'Restricted' : 'Default (all)'}
          color={restricted ? 'warning' : 'default'}
          variant="outlined"
          sx={{ mt: 0.5 }}
        />
      </Box>
      <Flex direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', flexGrow: 1 }}>
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
      <Flex direction="row" spacing={1}>
        <Button size="small" disabled={busy || !dirty} onClick={() => run(() => onSave(draft))}>
          Save
        </Button>
        <Button
          size="small"
          variant="text"
          disabled={busy || !restricted}
          onClick={() => run(onReset).then(() => setDraft(ACTIONS))}
        >
          Reset to default
        </Button>
      </Flex>
    </Flex>
  );
}
