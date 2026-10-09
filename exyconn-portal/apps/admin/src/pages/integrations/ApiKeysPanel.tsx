import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import BlockIcon from '@mui/icons-material/Block';
import { Alert, Box, Button, Chip, Flex, Text, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCreateApiKeyMutation,
  useListApiKeysQuery,
  useRevokeApiKeyMutation,
  type ListApiKeysQuery,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { roleLabel, roleList } from '@exyconn/shell/auth/roles';

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

type ApiKeyRow = ListApiKeysQuery['listApiKeys'][number];

/**
 * API keys — a machine's way in.
 *
 * The plaintext is shown exactly once, on creation, and the panel says so before anybody
 * clicks away. Everything after that is a prefix: the key itself is stored only as a hash,
 * so nobody — including an administrator — can recover it.
 */
export function ApiKeysPanel() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading, refetch } = useListApiKeysQuery();
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
    const ok = await confirm({
      message: 'Revoke this key? Anything using it stops working immediately.',
      confirmText: 'Revoke',
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeKey({ variables: { id } });
      notify('Key revoked. Anything using it stops working immediately.');
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not revoke the key', 'error');
    }
  };

  const columns: Column<ApiKeyRow>[] = [
    { key: 'name', label: 'Name' },
    {
      key: 'prefix',
      label: 'Prefix',
      render: (key) => (
        <Box component="span" sx={{ fontFamily: 'monospace' }}>
          {key.prefix}
        </Box>
      ),
    },
    { key: 'roles', label: 'Roles', render: (key) => roleList(key.roles, t) },
    {
      key: 'lastUsedAt',
      label: 'Last used',
      render: (key) => (key.lastUsedAt ? formatDateTime(key.lastUsedAt) : t('Never')),
    },
    {
      key: 'status',
      label: 'Status',
      render: (key) =>
        key.revokedAt ? (
          <Chip label={t('Revoked')} size="small" />
        ) : (
          <Chip label={t('Active')} size="small" color="success" />
        ),
    },
  ];
  const actions: RowAction<ApiKeyRow>[] = [
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Revoke',
      ariaLabel: 'Revoke key',
      color: 'error',
      hidden: (key) => Boolean(key.revokedAt),
      onClick: (key) => {
        revoke(key.id).catch((error: unknown) => console.error('Revoke', error));
      },
    },
  ];

  return (
    <Box>
      {issued ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setIssued(null)}>
          <Text size="sm" weight="bold" sx={{ display: 'block' }}>
            {t('Copy this key now — it is never shown again.')}
          </Text>
          <Text size="sm" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {issued}
          </Text>
        </Alert>
      ) : null}

      <Flex direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label={t('Name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          sx={{ minWidth: { sm: 240 }, width: { xs: '100%', sm: 'auto' } }}
        />
        <Flex
          direction="row"
          spacing={0.5}
          alignItems="center"
          role="group"
          aria-label={t('Roles')}
          sx={{ flexWrap: 'wrap', flex: 1, rowGap: 0.5 }}
        >
          {GRANTABLE_ROLES.map((role) => (
            <Chip
              key={role}
              label={t(roleLabel(role))}
              aria-pressed={roles.includes(role)}
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
          {t('Create key')}
        </Button>
      </Flex>

      <DataTable
        columns={columns}
        rows={data?.listApiKeys ?? []}
        actions={actions}
        loading={!data && loading}
        onRefresh={() => refetch()}
        emptyMessage="No API keys yet."
      />
    </Box>
  );
}
