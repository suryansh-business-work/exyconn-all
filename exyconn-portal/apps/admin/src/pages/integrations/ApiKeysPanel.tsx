import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCreateApiKeyMutation,
  useListApiKeysQuery,
  useRevokeApiKeyMutation,
} from '@exyconn/shell/graphql/generated';

/** The roles a key can be granted. Mirrors the portal's own list — a key is never more. */
const GRANTABLE_ROLES = [
  'ADMIN',
  'HR',
  'FINANCE',
  'CRM',
  'PRODUCTS',
  'PROJECTS',
  'SUPPORT',
  'TRACKER',
  'MARKETING',
];

/**
 * API keys — a machine's way in.
 *
 * The plaintext is shown exactly once, on creation, and the panel says so before anybody
 * clicks away. Everything after that is a prefix: the key itself is stored only as a hash,
 * so nobody — including an administrator — can recover it.
 */
export function ApiKeysPanel() {
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data, refetch } = useListApiKeysQuery();
  const [createKey] = useCreateApiKeyMutation();
  const [revokeKey] = useRevokeApiKeyMutation();

  const [name, setName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [issued, setIssued] = useState<string | null>(null);

  const create = async (): Promise<void> => {
    if (name.trim() === '' || roles.length === 0) {
      notify('Name the key and give it at least one role.', 'error');
      return;
    }
    try {
      const result = await createKey({ variables: { name: name.trim(), roles } });
      setIssued(result.data?.createApiKey.key ?? null);
      setName('');
      setRoles([]);
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create the key', 'error');
    }
  };

  const revoke = async (id: string): Promise<void> => {
    try {
      await revokeKey({ variables: { id } });
      notify('Key revoked. Anything using it stops working immediately.');
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not revoke the key', 'error');
    }
  };

  return (
    <Box>
      {issued ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setIssued(null)}>
          <Text size="sm" weight="bold" sx={{ display: 'block' }}>
            Copy this key now — it is never shown again.
          </Text>
          <Text size="sm" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {issued}
          </Text>
        </Alert>
      ) : null}

      <Flex direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Flex direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', flex: 1 }}>
          {GRANTABLE_ROLES.map((role) => (
            <Chip
              key={role}
              label={role}
              color={roles.includes(role) ? 'primary' : 'default'}
              onClick={() =>
                setRoles((current) =>
                  current.includes(role)
                    ? current.filter((value) => value !== role)
                    : [...current, role],
                )
              }
            />
          ))}
        </Flex>
        <Button
          variant="contained"
          onClick={() => {
            create().catch((error: unknown) => console.error('Create key failed', error));
          }}
        >
          Create key
        </Button>
      </Flex>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Prefix</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Last used</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data?.listApiKeys ?? []).map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{key.prefix}</TableCell>
              <TableCell>{key.roles.join(', ')}</TableCell>
              <TableCell>{key.lastUsedAt ? formatDateTime(key.lastUsedAt) : 'Never'}</TableCell>
              <TableCell align="right">
                {key.revokedAt ? (
                  <Chip label="Revoked" size="small" />
                ) : (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      revoke(key.id).catch((error: unknown) => console.error('Revoke', error));
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
